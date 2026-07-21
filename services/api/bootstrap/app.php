<?php

use App\Http\Middleware\FirebaseAuthMiddleware;
use App\Http\Middleware\LimitRequestSize;
use App\Http\Middleware\MastermindAuth;
use App\Http\Middleware\RequestIdMiddleware;
use App\Http\Middleware\RoleMiddleware;
use App\Providers\FirebaseAuthServiceProvider;
use App\Providers\RateLimiterServiceProvider;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Routing\Middleware\ThrottleRequestsWithRedis;
use Sentry\Laravel\ServiceProvider;
use Symfony\Component\Routing\Exception\RouteNotFoundException;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        FirebaseAuthServiceProvider::class,
        RateLimiterServiceProvider::class,
        ServiceProvider::class,
    ])
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(RequestIdMiddleware::class);
        $middleware->prepend(LimitRequestSize::class);

        $middleware->api(remove: [
            ThrottleRequests::class,
            ThrottleRequestsWithRedis::class,
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'mastermind' => MastermindAuth::class,
            'firebase' => FirebaseAuthMiddleware::class,
            'throttle' => ThrottleRequests::class,
            'limit' => LimitRequestSize::class,
        ]);

        $middleware->trustProxies(at: '*');
        $middleware->redirectGuestsTo('/login');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->renderable(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }
        });

        $exceptions->renderable(function (RouteNotFoundException $e, Request $request) {
            if (($request->is('api/*') || $request->expectsJson()) && str_contains($e->getMessage(), 'login')) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();
