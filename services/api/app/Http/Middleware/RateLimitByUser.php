<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class RateLimitByUser
{
    public function handle(Request $request, Closure $next, string $limit = '60,1'): void
    {
        $key = $request->user()?->id ?: $request->ip();
        $maxAttempts = (int) explode(',', $limit)[0];
        $decayMinutes = (int) explode(',', $limit)[1];

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            abort(429, 'Too many requests. Please try again later.');
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);
        $response->headers->set('X-RateLimit-Remaining', $maxAttempts - RateLimiter::attempts($key));

        response($response);
    }
}
