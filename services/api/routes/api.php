<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\GeofenceController;
use App\Http\Controllers\Api\DashboardController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function () {
    // Public
    Route::post('auth/login', [AuthController::class, 'login']);

    // Protected
    Route::middleware('auth:api')->group(function () {
        // Auth
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/refresh', [AuthController::class, 'refresh']);

        // Dashboard
        Route::get('dashboard/stats', [DashboardController::class, 'stats']);

        // Employees
        Route::apiResource('employees', EmployeeController::class);
        Route::get('employees/inactive/list', [EmployeeController::class, 'inactive']);

        // Attendance
        Route::get('attendance', [AttendanceController::class, 'index']);
        Route::get('attendance/reports', [AttendanceController::class, 'reports']);
        Route::post('attendance/check-in', [AttendanceController::class, 'checkIn']);
        Route::post('attendance/check-out', [AttendanceController::class, 'checkOut']);

        // Geofences
        Route::apiResource('geofences', GeofenceController::class);
        Route::post('geofences/check-inside', [GeofenceController::class, 'checkInside']);
    });
});
