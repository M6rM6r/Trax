<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceController extends Controller
{
    public function index()
    {
        $records = Attendance::with('employee')->orderBy('date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    public function reports()
    {
        $records = Attendance::with('employee')->orderBy('date', 'desc')->get();

        $stats = [
            'total' => $records->count(),
            'present' => $records->where('status', 'present')->count(),
            'late' => $records->where('status', 'late')->count(),
            'absent' => $records->where('status', 'absent')->count(),
            'on_time_rate' => $records->count() > 0
                ? round($records->where('status', 'present')->count() / $records->count() * 100, 2)
                : 0,
            'avg_late_minutes' => round($records->where('status', 'late')->avg('late_minutes') ?? 0, 2),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $records,
                'stats' => $stats,
            ],
        ]);
    }

    public function checkIn(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'geofence_id' => 'nullable|exists:geofences,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $today = now()->toDateString();
        $existing = Attendance::where('employee_id', $request->employee_id)
            ->where('date', $today)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Already checked in today',
            ], 409);
        }

        $checkInTime = now()->format('H:i');
        $isLate = now()->gt(now()->setTime(9, 0));

        $record = Attendance::create([
            'employee_id' => $request->employee_id,
            'date' => $today,
            'check_in_time' => $checkInTime,
            'check_in_lat' => $request->lat,
            'check_in_lng' => $request->lng,
            'geofence_id' => $request->geofence_id,
            'status' => $isLate ? 'late' : 'present',
            'late_minutes' => $isLate ? now()->diffInMinutes(now()->setTime(9, 0)) : 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Check-in successful',
            'data' => $record,
        ], 201);
    }

    public function checkOut(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $today = now()->toDateString();
        $record = Attendance::where('employee_id', $request->employee_id)
            ->where('date', $today)
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'No check-in record found for today',
            ], 404);
        }

        if ($record->check_out_time) {
            return response()->json([
                'success' => false,
                'message' => 'Already checked out',
            ], 409);
        }

        $checkOutTime = now()->format('H:i');
        $record->update([
            'check_out_time' => $checkOutTime,
            'status' => 'checked_out',
            'worked_hours' => $this->calculateWorkedHours($record->check_in_time, $checkOutTime),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Check-out successful',
            'data' => $record,
        ]);
    }

    private function calculateWorkedHours(string $checkIn, string $checkOut): float
    {
        $start = now()->setTimeFromTimeString($checkIn);
        $end = now()->setTimeFromTimeString($checkOut);

        return round($start->diffInMinutes($end) / 60, 2);
    }
}
