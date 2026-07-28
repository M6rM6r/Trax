<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

class AuthController extends Controller
{
    /**
     * Helper to find or create a user account for an employee
     */
    private function findOrCreateUser(?string $email, ?string $identifier = null, ?string $firebaseUid = null): ?User
    {
        $user = User::where('email', $email)
            ->when($identifier, function ($q) use ($identifier) {
                $q->orWhere('username', $identifier);
            })->first();

        $employee = Employee::where('email', $email)
            ->when($identifier, function ($q) use ($identifier) {
                $q->orWhere('employee_number', $identifier);
            })->first();

        if (! $user) {
            if ($employee) {
                $user = User::create([
                    'company_id' => $employee->company_id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'firebase_uid' => $firebaseUid,
                    'username' => $employee->employee_number,
                    'password' => Str::random(32),
                    'role' => $employee->role ?? 'employee',
                ]);
            }
        } elseif ($employee) {
            // If the email belongs to an employee, keep the auth account in sync with the employee record.
            $needsUpdate = false;
            if ($user->company_id != $employee->company_id) {
                $user->company_id = $employee->company_id;
                $needsUpdate = true;
            }
            if ($employee->name && $user->name !== $employee->name) {
                $user->name = $employee->name;
                $needsUpdate = true;
            }
            if ($employee->role && $user->role !== $employee->role) {
                $user->role = $employee->role;
                $needsUpdate = true;
            }
            if ($needsUpdate) {
                $user->save();
            }
        }

        return $user;
    }

    public function firebaseLogin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        try {
            $firebaseAuth = app(FirebaseAuth::class);
            $verifiedIdToken = $firebaseAuth->verifyIdToken($request->input('id_token'));
            $claims = $verifiedIdToken->claims();
            $email = $claims->get('email');
            $firebaseUid = $claims->get('sub');
        } catch (\Throwable $e) {
            Log::error('Firebase ID token verification failed', [
                'message' => $e->getMessage(),
                'class' => get_class($e),
            ]);

            return response()->json(['success' => false, 'message' => 'Firebase token verification failed: '.$e->getMessage()], 401);
        }

        if (empty($email)) {
            return response()->json(['success' => false, 'message' => 'Token has no email claim.'], 422);
        }

        $user = $this->findOrCreateUser($email, null, $firebaseUid);

        if (! $user) {
            return response()->json(['success' => false, 'message' => 'No account found for this Firebase user.'], 404);
        }

        if ($user->firebase_uid && $firebaseUid && ! hash_equals($user->firebase_uid, $firebaseUid)) {
            Log::warning('Firebase account linkage mismatch during login', [
                'user_id' => $user->id,
                'firebase_uid' => $firebaseUid,
            ]);

            return response()->json(['success' => false, 'message' => 'Firebase account linkage mismatch.'], 401);
        }

        // Store Firebase UID if not yet linked
        if (! $user->firebase_uid && $firebaseUid) {
            $user->firebase_uid = $firebaseUid;
            $user->save();
        }

        return $this->respondWithUser($user);
    }

    private function respondWithUser(User $user): JsonResponse
    {
        $linkedEmployee = Employee::where('company_id', $user->company_id)
            ->where('email', $user->email)
            ->first();

        $isEmployee = $linkedEmployee !== null;
        $role = $isEmployee ? 'employee' : $user->role;
        $name = $isEmployee
            ? ($linkedEmployee->name ?? $user->name)
            : $user->name;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $name,
                    'email' => $user->email,
                    'role' => $role,
                    'company_id' => $user->company_id,
                    'employee_id' => $linkedEmployee?->id,
                    'assigned_geofence_id' => $linkedEmployee?->geofence_id,
                ],
                'company' => $user->company ? ['id' => $user->company->id, 'name' => $user->company->name] : null,
            ],
        ]);
    }

    public function logout(): JsonResponse
    {
        // Firebase sign-out happens client-side; server just acknowledges.
        return response()->json(['success' => true, 'message' => 'Logout successful']);
    }

    public function me(): JsonResponse
    {
        $user = auth()->user();
        if (! $user instanceof User) {
            return response()->json(['success' => false], 401);
        }

        return $this->respondWithUser($user);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        try {
            $firebaseAuth = app(FirebaseAuth::class);
            $firebaseAuth->sendPasswordResetLink($request->input('email'));

            return response()->json([
                'success' => true,
                'message' => 'Password reset link sent to your email.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Forgot password failed: '.$e->getMessage());

            return response()->json([
                'success' => true,
                'message' => 'If an account exists for this email, a reset link has been sent.',
            ]);
        }
    }

}
