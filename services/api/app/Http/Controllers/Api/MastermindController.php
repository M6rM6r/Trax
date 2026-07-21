<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        $firebaseService = app(FirebaseUserService::class);
        $stats = $firebaseService->getDashboardStats();

        $recentCompanies = $firebaseService->listCompanies(5);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
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

        $firebaseService = app(FirebaseUserService::class);
        $companies = $firebaseService->listCompanies($perPage, $search, $plan, $status);

        return response()->json([
            'success' => true,
            'data' => $companies,
            'meta' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $perPage,
                'total' => count($companies),
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
            'admin_email' => ['required', 'email'],
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

        $firebaseService = app(FirebaseUserService::class);

        // Create company in Firestore
        $companyId = $firebaseService->createCompany([
            'name' => $companyName,
            'slug' => strtolower(str_replace(' ', '-', $companyName)),
            'email' => $companyEmail,
            'industry' => $request->input('industry'),
            'phone' => $request->input('phone'),
            'address' => $request->input('address'),
            'plan' => $plan,
            'max_employees' => (int) $maxEmployees,
            'active' => $request->boolean('active', true),
            'trial_ends_at' => $plan === 'trial' ? now()->addDays(14)->toIso8601String() : null,
            'created_at' => now()->toIso8601String(),
            'updated_at' => now()->toIso8601String(),
        ]);

        if (! $companyId) {
            return response()->json(['success' => false, 'message' => 'Failed to create company in Firestore.'], 500);
        }

        // Create Firebase Auth user for the admin
        $firebaseUid = $firebaseService->createUser(
            $request->input('admin_email'),
            $adminPassword,
            $adminName,
        );

        if (! $firebaseUid) {
            return response()->json(['success' => false, 'message' => 'Failed to create Firebase Auth user.'], 500);
        }

        // Sync user profile to Firestore
        $firebaseService->syncUserProfile($firebaseUid, [
            'id' => $companyId,
            'name' => $adminName,
            'email' => $request->input('admin_email'),
            'role' => $adminRole,
            'company_id' => $companyId,
            'company_name' => $companyName,
            'employee_id' => null,
            'assigned_geofence_id' => null,
            'created_at' => now()->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Company and admin account created successfully.',
            'data' => [
                'company' => ['id' => $companyId, 'name' => $companyName],
                'admin' => [
                    'name' => $adminName,
                    'email' => $request->input('admin_email'),
                    'role' => $adminRole,
                    'password' => $adminPassword,
                ],
            ],
        ], 201);
    }

    public function showCompany(string $companyId): JsonResponse
    {
        $firebaseService = app(FirebaseUserService::class);
        $company = $firebaseService->getCompany($companyId);

        if (! $company) {
            return response()->json(['success' => false, 'message' => 'Company not found.'], 404);
        }

        $recentEmployees = $firebaseService->listEmployeesByCompany($companyId);
        $geofences = $firebaseService->listGeofencesByCompany($companyId);

        return response()->json([
            'success' => true,
            'data' => [
                'company' => array_merge($company, [
                    'users_count' => 1, // Admin count
                    'employees_count' => count($recentEmployees),
                    'geofences_count' => count($geofences),
                ]),
                'recentEmployees' => array_slice($recentEmployees, 0, 10),
                'geofences' => $geofences,
            ],
        ]);
    }

    public function updateCompany(Request $request, string $companyId): JsonResponse
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

        $firebaseService = app(FirebaseUserService::class);
        $success = $firebaseService->updateCompany($companyId, array_filter($request->only([
            'name', 'email', 'industry', 'phone', 'address', 'plan', 'max_employees', 'active',
        ]), fn($v) => $v !== null));

        if (! $success) {
            return response()->json(['success' => false, 'message' => 'Failed to update company.'], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Company updated successfully.',
            'data' => $firebaseService->getCompany($companyId),
        ]);
    }

    public function destroyCompany(string $companyId): JsonResponse
    {
        $firebaseService = app(FirebaseUserService::class);
        $success = $firebaseService->deleteCompany($companyId);

        if (! $success) {
            return response()->json(['success' => false, 'message' => 'Failed to delete company.'], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Company deleted successfully.',
        ]);
    }

    public function reports(): JsonResponse
    {
        $firebaseService = app(FirebaseUserService::class);
        $stats = $firebaseService->getDashboardStats();

        return response()->json([
            'success' => true,
            'data' => [
                'dailyAttendance' => [],
                'plans' => ['trial' => $stats['trialCompanies'], 'basic' => 0, 'pro' => 0, 'enterprise' => 0],
                'topCompanies' => $firebaseService->listCompanies(10),
                'dateRange' => ['start' => now()->subDays(30)->toDateString(), 'end' => now()->toDateString()],
            ],
        ]);
    }
}
