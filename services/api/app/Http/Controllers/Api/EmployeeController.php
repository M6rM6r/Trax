<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use App\Http\Resources\EmployeeResource;
use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * @OA\Tag(
 *     name="Employees",
 *     description="API endpoints for managing employees"
 * )
 */
class EmployeeController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/employees",
     *     summary="Get all employees with pagination",
     *     tags={"Employees"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="page", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="department", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="status", in="query", @OA\Schema(type="string")),
     *     @OA\Response(
     *         response=200,
     *         description="Paginated list of employees",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Employee")),
     *             @OA\Property(property="meta", type="object")
     *         )
     *     )
     * )
     */
    private function companyId(): int
    {
        return auth()->user()->company_id;
    }

    public function index(Request $request): JsonResponse
    {
        $companyId = $this->companyId();
        $perPage = min((int) $request->query('per_page', 20), 100);
        $search = $request->query('search');
        $department = $request->query('department');
        $status = $request->query('status', 'active');

        $query = Employee::with('geofence')->where('company_id', $companyId);

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }
        if ($department) {
            $query->where('department', $department);
        }

        $result = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => EmployeeResource::collection($result->items()),
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page'    => $result->lastPage(),
                'per_page'     => $result->perPage(),
                'total'        => $result->total(),
                'from'         => $result->firstItem(),
                'to'           => $result->lastItem(),
            ],
        ]);
    }

    public function inactive(): JsonResponse
    {
        $employees = Employee::where('company_id', $this->companyId())
            ->where('status', 'inactive')->get();

        return response()->json([
            'success' => true,
            'data' => EmployeeResource::collection($employees),
        ]);
    }

    public function departments(): JsonResponse
    {
        $departments = Employee::where('company_id', $this->companyId())
            ->select('department')
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct()
            ->orderBy('department')
            ->pluck('department');

        return response()->json([
            'success' => true,
            'data' => $departments,
        ]);
    }

    public function show($id): JsonResponse
    {
        $employee = Employee::with('geofence')
            ->where('company_id', $this->companyId())
            ->find($id);

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
        }

        return response()->json(['success' => true, 'data' => new EmployeeResource($employee)]);
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $companyId = $this->companyId();

        DB::beginTransaction();
        try {
            $employee = Employee::create([
                'company_id'  => $companyId,
                'name'        => $validated['name'],
                'email'       => $validated['email'],
                'phone'       => $validated['phone'],
                'role'        => $validated['role'],
                'department'  => $validated['department'],
                'avatar'      => $validated['avatar'] ?? null,
                'geofence_id' => $validated['geofence_id'] ?? $validated['geofenceId'] ?? null,
                'status'      => $validated['status'] ?? 'active',
            ]);

            User::create([
                'company_id' => $companyId,
                'name'       => $validated['name'],
                'email'      => $validated['email'],
                'password'   => Hash::make($validated['password']),
                'role'       => $validated['role'],
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to create employee: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Employee created',
            'data'    => new EmployeeResource($employee),
        ], 201);
    }

    public function update(UpdateEmployeeRequest $request, $id): JsonResponse
    {
        $employee = Employee::where('company_id', $this->companyId())->find($id);

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
        }

        $employee->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Employee updated',
            'data'    => new EmployeeResource($employee->fresh('geofence')),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $employee = Employee::where('company_id', $this->companyId())->find($id);

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
        }

        $employee->delete();

        return response()->json(['success' => true, 'message' => 'Employee deleted']);
    }

    public function export(Request $request): StreamedResponse
    {
        $companyId = $this->companyId();
        $search = $request->query('search');
        $department = $request->query('department');

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="employees_' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($companyId, $search, $department) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($handle, ['ID', 'Name', 'Email', 'Phone', 'Department', 'Role', 'Status', 'Geofence']);

            $query = Employee::with('geofence')->where('company_id', $companyId);
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }
            if ($department) {
                $query->where('department', $department);
            }

            $query->chunk(200, function ($employees) use ($handle) {
                foreach ($employees as $emp) {
                    fputcsv($handle, [
                        $emp->id, $emp->name, $emp->email, $emp->phone,
                        $emp->department, $emp->role, $emp->status,
                        $emp->geofence?->name ?? 'N/A',
                    ]);
                }
            });

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
