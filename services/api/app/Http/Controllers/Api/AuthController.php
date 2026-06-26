<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        $user = auth()->user();

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'token'      => $token,
                'user'       => [
                    'id'         => $user->id,
                    'name'       => $user->name,
                    'email'      => $user->email,
                    'role'       => $user->role,
                    'company_id' => $user->company_id,
                ],
                'company'    => $user->company ? [
                    'id'   => $user->company->id,
                    'name' => $user->company->name,
                    'plan' => $user->company->plan,
                ] : null,
                'expires_in' => auth()->factory()->getTTL() * 60,
            ],
        ]);
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
        return response()->json([
            'success' => true,
            'data' => auth()->user(),
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
                'expires_in' => auth()->factory()->getTTL() * 60,
            ],
        ]);
    }
}
