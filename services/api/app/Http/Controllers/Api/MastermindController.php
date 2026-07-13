<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Geofence;
use App\Models\User;
use App\Services\FirebaseUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

class MastermindController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_token' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $masterEmail = config('app.master_email');

        if (! $masterEmail) {
            return response()->json(['success' => false, 'message' => 'MasterMind not configured.'], 503);
        }

        try {
            $firebaseAuth = app(FirebaseAuth::class);
            $verifiedIdToken = $firebaseAuth->verifyIdToken($request->input('id_token'));
            $email = $verifiedIdToken->claims()->get('email');
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Invalid Firebase token.'], 401);
        }

        if ($email !== $masterEmail) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'email' => $masterEmail,
                'role' => 'mastermind',
            ],
        ]);
    }

    public function dashboard(): JsonResponse
    {
        $companies = Company::count();
        $activeCompanies = Company::where('active', true)->count();
        $trialCompanies = Company::where('plan', 'trial')->count();
        $users = User::count();
        $employees = Employee::count();
        $geofences = Geofence::count();
        $attendanceToday = Attendance::where('date', now()->toDateString())->count();
        $checkedOutToday = Attendance::where('date', now()->toDateString())->where('status', 'checked_out')->count();

        $recentCompanies = Company::withCount(['users', 'employees'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'companies' => $companies,
                    'activeCompanies' => $activeCompanies,
                    'trialCompanies' => $trialCompanies,
                    'users' => $users,
                    'employees' => $employees,
                    'geofences' => $geofences,
                    'attendanceToday' => $attendanceToday,
                    'checkedOutToday' => $checkedOutToday,
                ],
                'recentCompanies' => $recentCompanies,
            ],
        ]);
    }

    public function companies(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 100);
        $search = $request->query('search');
        $plan = $request->query('plan');
        $status = $request->query('status');

        $query = Company::withCount(['users', 'employees', 'geofences'])
            ->orderBy('created_at', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($plan) {
            $query->where('plan', $plan);
        }

        if ($status === 'active') {
            $query->where('active', true);
        } elseif ($status === 'inactive') {
            $query->where('active', false);
        } elseif ($status === 'trial') {
            $query->where('plan', 'trial');
        }

        $paginated = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function storeCompany(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'industry' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'plan' => ['nullable', 'in:trial,basic,pro,enterprise'],
            'max_employees' => ['nullable', 'integer', 'min:1'],
            'active' => ['boolean'],
            'admin_name' => ['nullable', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'unique:users,email'],
            'admin_password' => ['required', 'string', 'min:6'],
            'admin_role' => ['nullable', 'in:boss,manager'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $adminPassword = $request->input('admin_password');
        $companyEmail = $request->input('email');
        $companyName = $request->input('name') ?: $companyEmail;
        $adminName = $request->input('admin_name') ?: $request->input('admin_email');
        $plan = $request->input('plan') ?: 'trial';
        $maxEmployees = $request->input('max_employees') ?: 10;
        $adminRole = $request->input('admin_role') ?: 'manager';

        $company = Company::create([
            'name' => $companyName,
            'slug' => Company::generateSlug($companyName),
            'email' => $companyEmail,
            'industry' => $request->input('industry'),
            'phone' => $request->input('phone'),
            'address' => $request->input('address'),
            'plan' => $plan,
            'max_employees' => (int) $maxEmployees,
            'active' => $request->boolean('active', true),
            'trial_ends_at' => $plan === 'trial' ? now()->addDays(14) : null,
        ]);

        // Create Firebase Auth user for the admin
        $firebaseService = app(FirebaseUserService::class);
        $firebaseUid = $firebaseService->createUser(
            $request->input('admin_email'),
            $adminPassword,
            $adminName,
        );

        $admin = User::create([
            'company_id' => $company->id,
            'name' => $adminName,
            'email' => $request->input('admin_email'),
            'firebase_uid' => $firebaseUid,
            'username' => null,
            'password' => $adminPassword,
            'role' => $adminRole,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Company and admin account created successfully.',
            'data' => [
                'company' => $company,
                'admin' => [
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'role' => $admin->role,
                    'password' => $adminPassword,
                ],
            ],
        ], 201);
    }

    public function showCompany(Company $company): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'company' => $company->loadCount(['users', 'employees', 'geofences']),
                'recentEmployees' => $company->employees()->orderBy('created_at', 'desc')->limit(10)->get(),
                'users' => $company->users()->orderBy('created_at', 'desc')->limit(10)->get(),
            ],
        ]);
    }

    public function updateCompany(Request $request, Company $company): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'string', 'min:2', 'max:255'],
            'email' => ['sometimes', 'email'],
            'industry' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'plan' => ['sometimes', 'in:trial,basic,pro,enterprise'],
            'max_employees' => ['sometimes', 'integer', 'min:1'],
            'active' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $company->update($request->only([
            'name', 'email', 'industry', 'phone', 'address', 'plan', 'max_employees', 'active',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Company updated successfully.',
            'data' => $company,
        ]);
    }

    public function destroyCompany(Company $company): JsonResponse
    {
        $company->delete();

        return response()->json([
            'success' => true,
            'message' => 'Company deleted successfully.',
        ]);
    }

    public function reports(): JsonResponse
    {
        $start = now()->subDays(30)->toDateString();
        $end = now()->toDateString();

        $dailyAttendance = Attendance::selectRaw('date, COUNT(*) as total, SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present, SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) as late, SUM(CASE WHEN status = "checked_out" THEN 1 ELSE 0 END) as checked_out')
            ->whereBetween('date', [$start, $end])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $plans = Company::selectRaw('plan, COUNT(*) as count')
            ->groupBy('plan')
            ->pluck('count', 'plan');

        $topCompanies = Company::withCount('employees')
            ->orderBy('employees_count', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'dailyAttendance' => $dailyAttendance,
                'plans' => $plans,
                'topCompanies' => $topCompanies,
                'dateRange' => ['start' => $start, 'end' => $end],
            ],
        ]);
    }
}
