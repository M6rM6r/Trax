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

        if (! $user) {
            // Check if this is a known employee
            $employee = Employee::where('email', $email)
                ->when($identifier, function ($q) use ($identifier) {
                    $q->orWhere('employee_number', $identifier);
                })->first();

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

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
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
        return response()->json(['success' => true, 'message' => 'Reset disabled in easy-mode']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Reset disabled in easy-mode']);
    }
}
