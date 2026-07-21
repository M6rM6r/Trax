<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Models\User;
use App\Services\FirebaseUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
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
     *
     *     @OA\Parameter(name="page", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="department", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="status", in="query", @OA\Schema(type="string")),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Paginated list of employees",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Employee")),
     *             @OA\Property(property="meta", type="object")
     *         )
     *     )
     * )
     */
    private function companyId(): int
    {
        return (int) (Auth::user()?->company_id ?? 0);
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
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
                'from' => $result->firstItem(),
                'to' => $result->lastItem(),
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

    public function show(int $id): JsonResponse
    {
        $employee = Employee::with('geofence')
            ->where('company_id', $this->companyId())
            ->find($id);

        if (! $employee) {
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
                'company_id' => $companyId,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'employee_number' => $validated['employeeNumber'] ?? null,
                'phone' => $validated['phone'],
                'role' => $validated['role'],
                'department' => $validated['department'],
                'avatar' => $validated['avatar'] ?? null,
                'geofence_id' => $validated['geofence_id'] ?? $validated['geofenceId'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ]);

            // Create Firebase Auth user for this employee
            $firebaseService = app(FirebaseUserService::class);
            $firebaseUid = $firebaseService->createUser(
                $validated['email'],
                $validated['password'],
                $validated['name'],
            );

            // Link firebase_uid to employee record
            if ($firebaseUid) {
                $employee->firebase_uid = $firebaseUid;
                $employee->save();
            }

            User::create([
                'company_id' => $companyId,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'firebase_uid' => $firebaseUid,
                'username' => $validated['employeeNumber'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            // Clean up orphaned Firebase user if DB transaction failed
            if (isset($firebaseUid) && $firebaseUid) {
                try {
                    $firebaseService = app(FirebaseUserService::class);
                    $firebaseService->deleteUser($firebaseUid);
                } catch (\Throwable $cleanupErr) {
                    Log::error('Failed to cleanup Firebase user after rollback: '.$cleanupErr->getMessage());
                }
            }

            Log::error('Employee creation failed: '.$e->getMessage(), ['exception' => $e]);

            return response()->json(['success' => false, 'message' => 'Failed to create employee. Please try again.'], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Employee created',
            'data' => new EmployeeResource($employee),
        ], 201);
    }

    public function update(UpdateEmployeeRequest $request, int $id): JsonResponse
    {
        $employee = Employee::where('company_id', $this->companyId())->find($id);

        if (! $employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
        }

        $payload = $request->validated();
        $originalEmail = $employee->email;

        $linkedUser = User::where('company_id', $this->companyId())
            ->where('email', $originalEmail)
            ->first();

        if (array_key_exists('employeeNumber', $payload)) {
            $username = $payload['employeeNumber'];
            if ($username) {
                $usernameTaken = User::where('company_id', $this->companyId())
                    ->where('username', $username)
                    ->when($linkedUser, fn ($q) => $q->where('id', '!=', $linkedUser->id))
                    ->exists();

                if ($usernameTaken) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Username is already taken in this company.',
                    ], 422);
                }
            }
            $payload['employee_number'] = $payload['employeeNumber'];
            unset($payload['employeeNumber']);
        }

        $employee->update($payload);

        if ($linkedUser) {
            $linkedUser->update([
                'name' => $employee->name,
                'email' => $employee->email,
                'username' => $employee->employee_number,
                'role' => $employee->role,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Employee updated',
            'data' => new EmployeeResource($employee->fresh('geofence')),
        ]);
    }

    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $employee = Employee::where('company_id', $this->companyId())->find($id);

        if (! $employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
        }

        $linkedUser = User::where('company_id', $this->companyId())
            ->where('email', $employee->email)
            ->first();

        if (! $linkedUser) {
            return response()->json(['success' => false, 'message' => 'No login account linked to this employee'], 404);
        }

        $linkedUser->password = Hash::make($request->input('password'));
        $linkedUser->save();

        // Update Firebase Auth password if firebase_uid exists
        if ($linkedUser->firebase_uid) {
            try {
                $firebaseService = app(FirebaseUserService::class);
                $firebaseService->updatePassword($linkedUser->firebase_uid, $request->input('password'));
            } catch (\Throwable $e) {
                Log::error('Failed to update Firebase password: '.$e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $employee = Employee::where('company_id', $this->companyId())->find($id);

        if (! $employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
        }

        $linkedUser = User::where('company_id', $this->companyId())
            ->where('email', $employee->email)
            ->first();

        DB::beginTransaction();
        try {
            $employee->delete();

            if ($linkedUser) {
                $linkedUser->delete();
            }

            // Delete Firebase Auth user
            if ($employee->firebase_uid) {
                try {
                    $firebaseService = app(FirebaseUserService::class);
                    $firebaseService->deleteUser($employee->firebase_uid);
                } catch (\Throwable $e) {
                    Log::error('Failed to delete Firebase user: '.$e->getMessage());
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Employee deletion failed: '.$e->getMessage());

            return response()->json(['success' => false, 'message' => 'Failed to delete employee.'], 500);
        }

        return response()->json(['success' => true, 'message' => 'Employee deleted']);
    }

    public function export(Request $request): StreamedResponse
    {
        $companyId = $this->companyId();
        $search = $request->query('search');
        $department = $request->query('department');

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="employees_'.now()->format('Y-m-d').'.csv"',
        ];

        $callback = function () use ($companyId, $search, $department) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
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
