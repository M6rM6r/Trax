<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller
{
    public function check(): JsonResponse
    {
        $checks = [];
        $allHealthy = true;

        // Database check
        try {
            DB::select("SELECT 1");
            $checks['database'] = ['status' => 'healthy', 'latency_ms' => 0];
        } catch (\Exception $e) {
            $checks['database'] = ['status' => 'unhealthy', 'error' => $e->getMessage()];
            $allHealthy = false;
        }

        // Redis check
        try {
            Redis::ping();
            $checks['redis'] = ['status' => 'healthy'];
        } catch (\Exception $e) {
            $checks['redis'] = ['status' => 'unhealthy', 'error' => $e->getMessage()];
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

    public function ping(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'trax-api',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function metrics(): \Illuminate\Http\Response
    {
        $dbConnected = 0;
        $redisConnected = 0;

        try {
            DB::select("SELECT 1");
            $dbConnected = 1;
        } catch (\Exception) {}

        try {
            Redis::ping();
            $redisConnected = 1;
        } catch (\Exception) {}

        $metrics = "# HELP trax_api_db_connected Database connection status (1=connected, 0=disconnected)\n";
        $metrics .= "# TYPE trax_api_db_connected gauge\n";
        $metrics .= "trax_api_db_connected {$dbConnected}\n\n";

        $metrics .= "# HELP trax_api_redis_connected Redis connection status (1=connected, 0=disconnected)\n";
        $metrics .= "# TYPE trax_api_redis_connected gauge\n";
        $metrics .= "trax_api_redis_connected {$redisConnected}\n\n";

        $metrics .= "# HELP trax_api_employees_total Total number of employees\n";
        $metrics .= "# TYPE trax_api_employees_total gauge\n";
        $metrics .= "trax_api_employees_total " . \App\Models\Employee::count() . "\n\n";

        $metrics .= "# HELP trax_api_attendance_today Today's attendance count\n";
        $metrics .= "# TYPE trax_api_attendance_today gauge\n";
        $metrics .= "trax_api_attendance_today " . \App\Models\Attendance::where('date', now()->toDateString())->count() . "\n";

        return response($metrics, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
