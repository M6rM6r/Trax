<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Symfony\Component\HttpFoundation\Response;

class FirebaseAuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();

        if (! $bearer) {
            return response()->json([
                'success' => false,
                'message' => 'Missing authentication token.',
            ], 401);
        }

        try {
            $firebaseAuth = app(FirebaseAuth::class);
            $verifiedIdToken = $firebaseAuth->verifyIdToken($bearer);
            $claims = $verifiedIdToken->claims();
            $email = $claims->get('email');
            $firebaseUid = $claims->get('sub');
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired token.',
            ], 401);
        }

        if (empty($email)) {
            return response()->json([
                'success' => false,
                'message' => 'Token has no email claim.',
            ], 401);
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'No account found for this Firebase user.',
            ], 404);
        }

        if ($user->firebase_uid && $firebaseUid && ! hash_equals($user->firebase_uid, $firebaseUid)) {
            return response()->json([
                'success' => false,
                'message' => 'Firebase account linkage mismatch.',
            ], 401);
        }

        // Update firebase_uid if not set yet
        if (! $user->firebase_uid && $firebaseUid) {
            $user->firebase_uid = $firebaseUid;
            $user->save();
        }

        // Log the user in for auth()->user() usage in controllers
        auth()->setUser($user);

        return $next($request);
    }
}
