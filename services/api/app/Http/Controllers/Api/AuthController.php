<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Employee;
use Tymon\JWTAuth\Facades\JWTAuth;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;

class AuthController extends Controller
{
    /**
     * Helper to find or create a user account for an employee
     */
    private function findOrCreateUser($email, $identifier = null)
    {
        $user = User::where('email', $email)
            ->when($identifier, function($q) use ($identifier) {
                $q->orWhere('username', $identifier);
            })->first();

        if (!$user) {
            // Check if this is a known employee
            $employee = Employee::where('email', $email)
                ->when($identifier, function($q) use ($identifier) {
                    $q->orWhere('employee_number', $identifier);
                })->first();

            if ($employee) {
                // Auto-create user account for existing employee (Low Security Mode)
                $user = User::create([
                    'company_id' => $employee->company_id,
                    'name'       => $employee->name,
                    'email'      => $employee->email,
                    'username'   => $employee->employee_number,
                    'password'   => Hash::make('12345678'), // Default password
                    'role'       => $employee->role ?? 'employee',
                ]);
            }
        }

        return $user;
    }

    public function firebaseLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        try {
            try {
                $firebaseAuth = app(FirebaseAuth::class);
                $verifiedIdToken = $firebaseAuth->verifyIdToken($request->input('id_token'));
                $firebaseUser = $verifiedIdToken->claims();
                $email = $firebaseUser->get('email');
            } catch (\Throwable $e) {
                // Fallback for local/dev if Firebase service account is missing
                return response()->json(['success' => false, 'message' => 'Firebase verify failed'], 401);
            }

            if (empty($email)) {
                return response()->json(['success' => false, 'message' => 'Token has no email'], 422);
            }

            $user = $this->findOrCreateUser($email);

            if (!$user) {
                return response()->json(['success' => false, 'message' => 'No account found'], 404);
            }

            $token = JWTAuth::fromUser($user);
            return $this->respondWithToken($token, $user);

        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Login failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function login(Request $request)
    {
        $identifier = $request->input('identifier') ?? $request->input('email') ?? $request->input('username');

        if (!$identifier) {
            return response()->json(['success' => false, 'message' => 'Email/Username required'], 422);
        }

        // Find existing user or auto-create from employee record
        $user = $this->findOrCreateUser($identifier, $identifier);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Account not found'], 404);
        }

        // LOW SECURITY: Skip password check if password is '12345678' or if we want to allow anything
        // For now, we still check, but since we auto-create with '12345678', it's easy.
        // If you want to ALLOW ANY PASSWORD, uncomment the line below and remove the Hash::check:
        // $passwordMatches = true;
        $passwordMatches = Hash::check((string)$request->input('password'), (string)$user->password)
                           || $request->input('password') === '12345678';

        if (!$passwordMatches) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
        }

        $token = JWTAuth::fromUser($user);
        return $this->respondWithToken($token, $user);
    }

    private function respondWithToken($token, $user)
    {
        $linkedEmployee = Employee::where('company_id', $user->company_id)
            ->where('email', $user->email)
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
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
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
            ],
        ]);
    }

    public function logout()
    {
        try { JWTAuth::invalidate(JWTAuth::getToken()); } catch (\Exception $e) {}
        return response()->json(['success' => true, 'message' => 'Logout successful']);
    }

    public function me()
    {
        $user = Auth::guard('api')->user();
        if (!$user) return response()->json(['success' => false], 401);
        return $this->respondWithToken(JWTAuth::fromUser($user), $user);
    }

    public function forgotPassword(Request $request)
    {
        return response()->json(['success' => true, 'message' => 'Reset disabled in easy-mode']);
    }

    public function resetPassword(Request $request)
    {
        return response()->json(['success' => true, 'message' => 'Reset disabled in easy-mode']);
    }

    public function refresh()
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());
        return response()->json(['success' => true, 'data' => ['token' => $token, 'expires_in' => JWTAuth::factory()->getTTL() * 60]]);
    }
}
