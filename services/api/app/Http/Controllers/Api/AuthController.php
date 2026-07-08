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
    protected FirebaseAuth $firebaseAuth;

    public function __construct(FirebaseAuth $firebaseAuth)
    {
        $this->firebaseAuth = $firebaseAuth;
    }

    public function firebaseLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $verifiedIdToken = $this->firebaseAuth->verifyIdToken($request->input('id_token'));
            $firebaseUser = $verifiedIdToken->claims();
            $email = $firebaseUser->get('email');

            if (empty($email)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Firebase token does not contain an email',
                ], 422);
            }

            $user = User::where('email', $email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'No account found for this email',
                ], 404);
            }

            $token = JWTAuth::fromUser($user);

            $linkedEmployee = null;
            try {
                $linkedEmployee = Employee::where('company_id', $user->company_id)
                    ->where(function ($q) use ($user) {
                        $q->where('email', $user->email);
                        if (!empty($user->username)) {
                            $q->orWhere('employee_number', $user->username);
                        }
                    })
                    ->first();
            } catch (\Throwable) {
                $linkedEmployee = null;
            }

            $companyPayload = null;
            try {
                if ($user->company) {
                    $companyPayload = [
                        'id'   => $user->company->id,
                        'name' => $user->company->name,
                        'plan' => $user->company->plan,
                    ];
                }
            } catch (\Throwable) {
                $companyPayload = null;
            }

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'token'      => $token,
                    'user'       => [
                        'id'         => $user->id,
                        'name'       => $user->name,
                        'email'      => $user->email,
                        'username'   => $user->username,
                        'role'       => $user->role,
                        'company_id' => $user->company_id,
                        'employee_id' => $linkedEmployee?->id,
                        'assigned_geofence_id' => $linkedEmployee?->geofence_id,
                    ],
                    'company'    => $companyPayload,
                    'expires_in' => JWTAuth::factory()->getTTL() * 60,
                ],
            ]);
        } catch (FailedToVerifyToken $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Firebase token',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 401);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error',
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identifier' => 'nullable|string|max:255',
            'email' => 'nullable|string|max:255',
            'username' => 'nullable|string|max:255',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $identifier = $request->input('identifier')
            ?? $request->input('email')
            ?? $request->input('username');

        if (!$identifier) {
            return response()->json([
                'success' => false,
                'message' => 'Identifier is required',
            ], 422);
        }

        try {
            $user = User::where('email', $identifier)
                ->orWhere('username', $identifier)
                ->first();

            if (!$user || !Hash::check((string) $request->input('password'), (string) $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials',
                ], 401);
            }

            $token = JWTAuth::fromUser($user);

            $linkedEmployee = null;
            try {
                $linkedEmployee = Employee::where('company_id', $user->company_id)
                    ->where(function ($q) use ($user) {
                        $q->where('email', $user->email);
                        if (!empty($user->username)) {
                            $q->orWhere('employee_number', $user->username);
                        }
                    })
                    ->first();
            } catch (\Throwable) {
                $linkedEmployee = null;
            }

            $companyPayload = null;
            try {
                if ($user->company) {
                    $companyPayload = [
                        'id'   => $user->company->id,
                        'name' => $user->company->name,
                        'plan' => $user->company->plan,
                    ];
                }
            } catch (\Throwable) {
                $companyPayload = null;
            }

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'token'      => $token,
                    'user'       => [
                        'id'         => $user->id,
                        'name'       => $user->name,
                        'email'      => $user->email,
                        'username'   => $user->username,
                        'role'       => $user->role,
                        'company_id' => $user->company_id,
                        'employee_id' => $linkedEmployee?->id,
                        'assigned_geofence_id' => $linkedEmployee?->geofence_id,
                    ],
                    'company'    => $companyPayload,
                    'expires_in' => JWTAuth::factory()->getTTL() * 60,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error',
            ], 500);
        }
    }

    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    public function me()
    {
        $user = Auth::guard('api')->user();
        $linkedEmployee = null;
        try {
            $linkedEmployee = Employee::where('company_id', $user->company_id)
                ->where(function ($q) use ($user) {
                    $q->where('email', $user->email);
                    if (!empty($user->username)) {
                        $q->orWhere('employee_number', $user->username);
                    }
                })
                ->first();
        } catch (\Throwable) {
            $linkedEmployee = null;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'role' => $user->role,
                'company_id' => $user->company_id,
                'employee_id' => $linkedEmployee?->id,
                'assigned_geofence_id' => $linkedEmployee?->geofence_id,
            ],
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'البريد الإلكتروني غير مسجل في النظام'], 422);
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        $resetUrl = config('app.frontend_url', 'http://localhost:3000') . '/ar/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        try {
            Mail::raw(
                "مرحباً،\n\nلإعادة تعيين كلمة مرورك انقر على الرابط:\n\n{$resetUrl}\n\nهذا الرابط صالح لمدة 60 دقيقة.\n\nإذا لم تطلب هذا، تجاهل هذا البريد.\n\nفريق Trax",
                function ($message) use ($request) {
                    $message->to($request->email)->subject('إعادة تعيين كلمة المرور — Trax');
                }
            );
        } catch (\Throwable) {
            // Mail sending failed silently — token still saved
        }

        return response()->json(['success' => true, 'message' => 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني']);
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token'                 => 'required|string',
            'email'                 => 'required|email|exists:users,email',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $record = DB::table('password_reset_tokens')->where('email', $request->email)->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json(['success' => false, 'message' => 'الرابط غير صحيح أو منتهي الصلاحية'], 422);
        }

        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['success' => false, 'message' => 'انتهت صلاحية الرابط. يرجى طلب رابط جديد.'], 422);
        }

        User::where('email', $request->email)->update(['password' => Hash::make($request->password)]);
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['success' => true, 'message' => 'تم تغيير كلمة المرور بنجاح']);
    }

    public function refresh()
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
            ],
        ]);
    }
}
