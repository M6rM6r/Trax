<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Symfony\Component\HttpFoundation\Response;

class MastermindAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();

        if (! $bearer) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $masterEmail = config('app.master_email');

        if (! $masterEmail) {
            return response()->json(['success' => false, 'message' => 'MasterMind not configured.'], 503);
        }

        try {
            $firebaseAuth = app(FirebaseAuth::class);
            $verifiedIdToken = $firebaseAuth->verifyIdToken($bearer);
            $email = $verifiedIdToken->claims()->get('email');
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired token.'], 401);
        }

        if ($email !== $masterEmail) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
