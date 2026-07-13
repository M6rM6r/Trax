<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

class HealthController extends Controller
{
    public function check(): JsonResponse
    {
        $checks = [];
        $allHealthy = true;

        // Database check
        try {
            DB::select('SELECT 1');
            $checks['database'] = ['status' => 'healthy', 'latency_ms' => 0];
        } catch (\Throwable $e) {
            $checks['database'] = ['status' => 'unhealthy', 'error' => $e->getMessage()];
            $allHealthy = false;
        }

        // Redis check (only when extension is available)
        if (extension_loaded('redis')) {
            try {
                Redis::ping();
                $checks['redis'] = ['status' => 'healthy'];
            } catch (\Throwable $e) {
                $checks['redis'] = ['status' => 'unhealthy', 'error' => $e->getMessage()];
                $allHealthy = false;
            }
        }

        // Firebase check
        try {
            $firebaseAuth = app(FirebaseAuth::class);
            $firebaseAuth->getUserByEmail(config('app.master_email', 'mastermind@trax.com'));
            $checks['firebase'] = ['status' => 'healthy'];
        } catch (\Throwable $e) {
            $checks['firebase'] = ['status' => 'unhealthy', 'error' => $e->getMessage()];
            $allHealthy = false;
        }

        // App info
        $checks['app'] = [
            'name' => config('app.name'),
            'env' => config('app.env'),
            'timezone' => config('app.timezone'),
        ];

        return response()->json([
            'status' => $allHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], $allHealthy ? 200 : 503);
    }

    public function detailed(): JsonResponse
    {
        $checks = [];
        $allHealthy = true;

        // Database check with latency
        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $latency = round((microtime(true) - $start) * 1000, 2);
            $checks['database'] = ['status' => 'healthy', 'latency_ms' => $latency, 'driver' => config('database.default')];
        } catch (\Throwable $e) {
            $checks['database'] = ['status' => 'unhealthy', 'error' => $e->getMessage()];
            $allHealthy = false;
        }

        // Redis check (only when extension is available)
        if (extension_loaded('redis')) {
            try {
                Redis::ping();
                $checks['redis'] = ['status' => 'healthy'];
            } catch (\Throwable $e) {
                $checks['redis'] = ['status' => 'unhealthy', 'error' => $e->getMessage()];
                $allHealthy = false;
            }
        }

        // Firebase check
        try {
            $firebaseAuth = app(FirebaseAuth::class);
            $firebaseAuth->getUserByEmail(config('app.master_email', 'mastermind@trax.com'));
            $checks['firebase'] = ['status' => 'healthy'];
        } catch (\Throwable $e) {
            $checks['firebase'] = ['status' => 'unhealthy', 'error' => $e->getMessage()];
            $allHealthy = false;
        }

        // Record counts
        try {
            $checks['records'] = [
                'employees' => Employee::count(),
                'attendance_today' => Attendance::where('date', now()->toDateString())->count(),
            ];
        } catch (\Throwable $e) {
            $checks['records'] = ['status' => 'error', 'error' => $e->getMessage()];
        }

        $checks['app'] = [
            'name' => config('app.name'),
            'env' => config('app.env'),
            'timezone' => config('app.timezone'),
            'php_version' => PHP_VERSION,
        ];

        return response()->json([
            'status' => $allHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], $allHealthy ? 200 : 503);
    }

    public function ping(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'trax-api',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function metrics(): Response
    {
        $dbConnected = 0;
        $redisConnected = 0;

        try {
            DB::select('SELECT 1');
            $dbConnected = 1;
        } catch (\Exception) {
        }

        try {
            Redis::ping();
            $redisConnected = 1;
        } catch (\Exception) {
        }

        $metrics = "# HELP trax_api_db_connected Database connection status (1=connected, 0=disconnected)\n";
        $metrics .= "# TYPE trax_api_db_connected gauge\n";
        $metrics .= "trax_api_db_connected {$dbConnected}\n\n";

        $metrics .= "# HELP trax_api_redis_connected Redis connection status (1=connected, 0=disconnected)\n";
        $metrics .= "# TYPE trax_api_redis_connected gauge\n";
        $metrics .= "trax_api_redis_connected {$redisConnected}\n\n";

        $metrics .= "# HELP trax_api_employees_total Total number of employees\n";
        $metrics .= "# TYPE trax_api_employees_total gauge\n";
        $metrics .= 'trax_api_employees_total '.Employee::count()."\n\n";

        $metrics .= "# HELP trax_api_attendance_today Today's attendance count\n";
        $metrics .= "# TYPE trax_api_attendance_today gauge\n";
        $metrics .= 'trax_api_attendance_today '.Attendance::where('date', now()->toDateString())->count()."\n";

        return response($metrics, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
