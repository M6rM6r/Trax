<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RateLimiterServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $key = strtolower(trim((string) ($request->input('identifier') ?? $request->input('email') ?? $request->ip())));

            return Limit::perMinute(10)->by('login|'.$key);
        });

        RateLimiter::for('api', function (Request $request) {
            $user = $request->user();
            $key = $user ? 'user:'.$user->id : 'ip:'.$request->ip();

            return Limit::perMinute(120)->by($key);
        });
    }
}
