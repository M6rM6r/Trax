<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\GeofenceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TrackingController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\CompanyController;
use Illuminate\Support\Facades\Route;

// Public health checks — no auth required
Route::get('health', [HealthController::class, 'check']);
Route::get('ping', [HealthController::class, 'ping']);
Route::get('metrics', [HealthController::class, 'metrics']);
Route::get('plans', [CompanyController::class, 'plans']);

// Public — strict rate limit on auth
Route::post('auth/login', [AuthController::class, 'login'])
    ->middleware(['throttle:5,1']);

// Company registration (SaaS signup) — public
Route::post('companies/register', [CompanyController::class, 'register'])
    ->middleware(['throttle:10,1']);

// Password reset — public
Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword'])
    ->middleware(['throttle:5,1']);
Route::post('auth/reset-password', [AuthController::class, 'resetPassword'])
    ->middleware(['throttle:5,1']);

// Protected
Route::middleware('auth:api')->group(function () {
    // Company management
    Route::get('company', [CompanyController::class, 'show']);
    Route::put('company', [CompanyController::class, 'update']);

    // Auth
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/refresh', [AuthController::class, 'refresh'])
        ->middleware(['throttle:10,1']);

    // Management-only endpoints
    Route::middleware(['role:boss,manager,supervisor'])->group(function () {
        // Dashboard
        Route::get('dashboard/stats', [DashboardController::class, 'stats'])
            ->middleware(['throttle:60,1']);
        Route::get('dashboard/trends', [DashboardController::class, 'trends'])
            ->middleware(['throttle:60,1']);
        Route::get('dashboard/departments', [DashboardController::class, 'departmentStats'])
            ->middleware(['throttle:60,1']);

        // Tracking — high frequency for live updates
        Route::get('tracking/live', [TrackingController::class, 'live'])
            ->middleware(['throttle:120,1']);

        // Employees — standard API rate limit
        Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('employees', [EmployeeController::class, 'index']);
        Route::post('employees', [EmployeeController::class, 'store']);
        Route::get('employees/{employee}', [EmployeeController::class, 'show']);
        Route::put('employees/{employee}', [EmployeeController::class, 'update']);
        Route::patch('employees/{employee}', [EmployeeController::class, 'update']);
        Route::delete('employees/{employee}', [EmployeeController::class, 'destroy']);
        Route::get('employees/inactive/list', [EmployeeController::class, 'inactive']);
        Route::get('employees/export/csv', [EmployeeController::class, 'export']);
        Route::get('employees/meta/departments', [EmployeeController::class, 'departments']);
        });

        // Attendance reports/listing
        Route::middleware(['throttle:30,1'])->group(function () {
            Route::get('attendance', [AttendanceController::class, 'index']);
            Route::get('attendance/reports', [AttendanceController::class, 'reports']);
        });

        // Geofences — standard API rate limit
        Route::middleware(['throttle:60,1'])->group(function () {
            Route::get('geofences', [GeofenceController::class, 'index']);
            Route::post('geofences', [GeofenceController::class, 'store']);
            Route::get('geofences/{geofence}', [GeofenceController::class, 'show']);
            Route::put('geofences/{geofence}', [GeofenceController::class, 'update']);
            Route::delete('geofences/{geofence}', [GeofenceController::class, 'destroy']);
            Route::post('geofences/check-inside', [GeofenceController::class, 'checkInside']);
        });
    });

    // Attendance actions — all authenticated roles
    Route::middleware(['throttle:30,1'])->group(function () {
        Route::post('attendance/check-in', [AttendanceController::class, 'checkIn']);
        Route::post('attendance/check-out', [AttendanceController::class, 'checkOut']);
    });

    // Device / FCM token
    Route::middleware(['throttle:30,1'])->group(function () {
        Route::post('device/fcm', [DeviceController::class, 'registerFcmToken']);
        Route::delete('device/fcm', [DeviceController::class, 'unregisterFcmToken']);
    });

});
