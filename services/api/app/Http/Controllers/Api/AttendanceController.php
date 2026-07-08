<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Http\Resources\AttendanceResource;
use App\Http\Requests\CheckInRequest;
use App\Http\Requests\CheckOutRequest;
use App\Events\AttendanceCheckedIn;
use App\Events\AttendanceCheckedOut;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class AttendanceController extends Controller
{
    private function companyId(): int
    {
        return auth()->user()->company_id;
    }

    public function index(): JsonResponse
    {
        $records = Attendance::with(['employee', 'geofence'])
            ->whereHas('employee', fn($q) => $q->where('company_id', $this->companyId()))
            ->orderBy('date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => AttendanceResource::collection($records),
        ]);
    }

    public function reports(): JsonResponse
    {
        $records = Attendance::with(['employee', 'geofence'])
            ->whereHas('employee', fn($q) => $q->where('company_id', $this->companyId()))
            ->orderBy('date', 'desc')->get();

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
                'records' => AttendanceResource::collection($records),
                'stats' => $stats,
            ],
        ]);
    }

    public function checkIn(CheckInRequest $request): JsonResponse
    {
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
        $lateThresholdHour = (int) config('trax.late_threshold_hour', 9);
        $lateThresholdMin  = (int) config('trax.late_threshold_minute', 0);
        $threshold = now()->setTime($lateThresholdHour, $lateThresholdMin);
        $isLate = now()->gt($threshold);

        $record = Attendance::create([
            'employee_id' => $request->employee_id,
            'date' => $today,
            'check_in_time' => $checkInTime,
            'check_in_lat' => $request->lat,
            'check_in_lng' => $request->lng,
            'geofence_id' => $request->geofence_id,
            'status' => $isLate ? 'late' : 'present',
            'late_minutes' => $isLate ? now()->diffInMinutes($threshold) : 0,
        ]);

        if ($request->filled('battery_level')) {
            $record->employee?->update(['battery_level' => $request->battery_level]);
        }

        try { Cache::tags(['attendance', 'dashboard'])->flush(); } catch (\Throwable) {}

        event(new AttendanceCheckedIn(
            $record->employee_id,
            $record->employee?->name ?? 'Unknown',
            $record->date,
            $record->check_in_time?->format('H:i'),
            $record->status,
            $record->geofence?->name
        ));

        return response()->json([
            'success' => true,
            'message' => 'Check-in successful',
            'data' => new AttendanceResource($record->load(['employee', 'geofence'])),
        ], 201);
    }

    public function checkOut(CheckOutRequest $request): JsonResponse
    {
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
            'check_out_status' => $record->status,
            'status' => 'checked_out',
            'worked_hours' => $this->calculateWorkedHours($record->check_in_time, $checkOutTime),
        ]);

        try { Cache::tags(['attendance', 'dashboard'])->flush(); } catch (\Throwable) {}

        event(new AttendanceCheckedOut(
            $record->employee_id,
            $record->employee?->name ?? 'Unknown',
            $record->date,
            $record->check_out_time?->format('H:i'),
            $record->status,
            $record->geofence?->name
        ));

        return response()->json([
            'success' => true,
            'message' => 'Check-out successful',
            'data' => new AttendanceResource($record->load(['employee', 'geofence'])),
        ]);
    }

    private function calculateWorkedHours(string $checkIn, string $checkOut): float
    {
        $start = now()->setTimeFromTimeString($checkIn);
        $end = now()->setTimeFromTimeString($checkOut);

        return round($start->diffInMinutes($end) / 60, 2);
    }
}
