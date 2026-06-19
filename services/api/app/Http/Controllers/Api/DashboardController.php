<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Geofence;

class DashboardController extends Controller
{
    public function stats()
    {
        $today = now()->toDateString();

        $totalEmployees = Employee::count();
        $presentToday = Attendance::where('date', $today)->where('status', 'present')->count();
        $lateToday = Attendance::where('date', $today)->where('status', 'late')->count();
        $absentToday = $totalEmployees - Attendance::where('date', $today)->count();
        $checkedOutToday = Attendance::where('date', $today)->where('status', 'checked_out')->count();
        $totalGeofences = Geofence::count();

        $onTimeRate = $totalEmployees > 0
            ? round(($presentToday / $totalEmployees) * 100, 2)
            : 0;

        $avgCheckIn = Attendance::where('date', $today)
            ->whereNotNull('check_in_time')
            ->avg('check_in_time');

        return response()->json([
            'success' => true,
            'data' => [
                'total_employees' => $totalEmployees,
                'present_today' => $presentToday,
                'late_today' => $lateToday,
                'absent_today' => $absentToday,
                'checked_out_today' => $checkedOutToday,
                'on_time_rate' => $onTimeRate,
                'avg_check_in_time' => $avgCheckIn ?? 'N/A',
                'total_geofences' => $totalGeofences,
            ],
        ]);
    }
}
