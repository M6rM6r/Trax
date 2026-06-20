<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\GeofenceController;
use App\Http\Controllers\Api\DashboardController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function () {
    // Public — strict rate limit on auth
    Route::post('auth/login', [AuthController::class, 'login'])
        ->middleware(['throttle:5,1']);

    // Protected
    Route::middleware('auth:api')->group(function () {
        // Auth
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/refresh', [AuthController::class, 'refresh']);

        // Dashboard
        Route::get('dashboard/stats', [DashboardController::class, 'stats']);

        // Employees — explicit RESTful routes
        Route::get('employees', [EmployeeController::class, 'index']);
        Route::post('employees', [EmployeeController::class, 'store']);
        Route::get('employees/{employee}', [EmployeeController::class, 'show']);
        Route::put('employees/{employee}', [EmployeeController::class, 'update']);
        Route::patch('employees/{employee}', [EmployeeController::class, 'update']);
        Route::delete('employees/{employee}', [EmployeeController::class, 'destroy']);
        Route::get('employees/inactive/list', [EmployeeController::class, 'inactive']);

        // Attendance
        Route::get('attendance', [AttendanceController::class, 'index']);
        Route::get('attendance/reports', [AttendanceController::class, 'reports']);
        Route::post('attendance/check-in', [AttendanceController::class, 'checkIn']);
        Route::post('attendance/check-out', [AttendanceController::class, 'checkOut']);

        // Geofences — explicit RESTful routes
        Route::get('geofences', [GeofenceController::class, 'index']);
        Route::post('geofences', [GeofenceController::class, 'store']);
        Route::get('geofences/{geofence}', [GeofenceController::class, 'show']);
        Route::put('geofences/{geofence}', [GeofenceController::class, 'update']);
        Route::delete('geofences/{geofence}', [GeofenceController::class, 'destroy']);
        Route::post('geofences/check-inside', [GeofenceController::class, 'checkInside']);
    });
});
