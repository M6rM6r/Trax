<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Subscription;
use App\Models\User;
use App\Services\FirebaseUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CompanyController extends Controller
{
    /**
     * Register a new company with an admin user.
     * This is the SaaS signup endpoint.
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'industry' => 'nullable|string|max:100',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ], [
            'company_name.required' => 'اسم الشركة مطلوب',
            'admin_name.required' => 'اسم المسؤول مطلوب',
            'admin_email.required' => 'البريد الإلكتروني مطلوب',
            'admin_email.unique' => 'البريد الإلكتروني مستخدم بالفعل',
            'admin_password.required' => 'كلمة المرور مطلوبة',
            'admin_password.min' => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        if (config('app.disable_company_self_registration', true)) {
            return response()->json([
                'success' => false,
                'message' => 'Company self-registration is disabled. Please contact MasterMind to create your company.',
            ], 403);
        }

        try {
            DB::beginTransaction();

            // Create company
            $company = Company::create([
                'name' => $request->company_name,
                'slug' => Company::generateSlug($request->company_name),
                'industry' => $request->industry,
                'plan' => 'trial',
                'max_employees' => 10,
                'trial_ends_at' => now()->addDays(14),
                'active' => true,
            ]);

            // Create Firebase Auth user for the admin
            $firebaseService = app(FirebaseUserService::class);
            $firebaseUid = $firebaseService->createUser(
                $request->admin_email,
                $request->admin_password,
                $request->admin_name,
            );

            // Create admin user
            $user = User::create([
                'company_id' => $company->id,
                'name' => $request->admin_name,
                'email' => $request->admin_email,
                'firebase_uid' => $firebaseUid,
                'password' => Hash::make($request->admin_password),
                'role' => 'boss',
            ]);

            // Create trial subscription record
            Subscription::create([
                'company_id' => $company->id,
                'plan' => 'trial',
                'employee_limit' => 10,
                'price_monthly' => 0,
                'starts_at' => now(),
                'ends_at' => now()->addDays(14),
                'active' => true,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الحساب بنجاح. تجربة مجانية لمدة 14 يوم.',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'company_id' => $company->id,
                        'company_name' => $company->name,
                    ],
                    'company' => [
                        'id' => $company->id,
                        'name' => $company->name,
                        'slug' => $company->slug,
                        'plan' => $company->plan,
                        'trial_ends_at' => $company->trial_ends_at,
                        'max_employees' => $company->max_employees,
                    ],
                ],
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Company registration failed: '.$e->getMessage(), ['exception' => $e]);

            return response()->json(['success' => false, 'message' => 'فشل في إنشاء الحساب. حاول مرة أخرى.'], 500);
        }
    }

    /**
     * Get current company info.
     */
    public function show(Request $request): JsonResponse
    {
        $company = $request->user()->company;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'industry' => $company->industry,
                'address' => $company->address,
                'phone' => $company->phone,
                'plan' => $company->plan,
                'max_employees' => $company->max_employees,
                'trial_ends_at' => $company->trial_ends_at,
                'active' => $company->active,
                'settings' => $company->settings,
                'employee_count' => $company->employees()->count(),
            ],
        ]);
    }

    /**
     * Update company settings.
     */
    public function update(Request $request): JsonResponse
    {
        $company = $request->user()->company;

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'industry' => 'sometimes|nullable|string|max:100',
            'address' => 'sometimes|nullable|string|max:500',
            'phone' => 'sometimes|nullable|string|max:20',
            'settings' => 'sometimes|nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $company->update($request->only(['name', 'industry', 'address', 'phone', 'settings']));

        return response()->json(['success' => true, 'message' => 'تم تحديث معلومات الشركة.']);
    }

    /**
     * Get plan/pricing info.
     */
    public function plans(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                ['key' => 'trial',      'name' => 'تجريبي',      'price' => 0,    'employees' => 10,  'duration' => '14 يوم'],
                ['key' => 'starter',    'name' => 'مبتدئ',       'price' => 199,  'employees' => 25,  'duration' => 'شهري'],
                ['key' => 'pro',        'name' => 'احترافي',     'price' => 499,  'employees' => 100, 'duration' => 'شهري'],
                ['key' => 'enterprise', 'name' => 'مؤسسي',       'price' => 1299, 'employees' => 999, 'duration' => 'شهري'],
            ],
        ]);
    }
}
