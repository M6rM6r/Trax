<?php

namespace App\Http\Controllers\Api;

use App\Events\AttendanceCheckedIn;
use App\Events\AttendanceCheckedOut;
use App\Http\Controllers\Controller;
use App\Http\Requests\CheckInRequest;
use App\Http\Requests\CheckOutRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Geofence;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class AttendanceController extends Controller
{
    private function companyId(): int
    {
        return (int) (auth()->user()?->company_id ?? 0);
    }

    private const GEOFENCE_DISTANCE_BUFFER_METERS = 50;

    private function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a =
            sin($dLat / 2) ** 2 +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    public function index(): JsonResponse
    {
        $perPage = min((int) request()->get('per_page', 50), 100);
        $fromDate = request()->get('from_date');
        $toDate = request()->get('to_date');

        $query = Attendance::with(['employee', 'geofence'])
            ->whereHas('employee', fn ($q) => $q->where('company_id', $this->companyId()))
            ->orderBy('date', 'desc');

        if ($fromDate) {
            $query->where('date', '>=', $fromDate);
        }
        if ($toDate) {
            $query->where('date', '<=', $toDate);
        }

        $records = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => AttendanceResource::collection($records->items()),
            'meta' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
        ]);
    }

    public function reports(): JsonResponse
    {
        $fromDate = request()->get('from_date', now()->subDays(30)->toDateString());
        $toDate = request()->get('to_date', now()->toDateString());

        $records = Attendance::with(['employee', 'geofence'])
            ->whereHas('employee', fn ($q) => $q->where('company_id', $this->companyId()))
            ->whereBetween('date', [$fromDate, $toDate])
            ->orderBy('date', 'desc')
            ->limit(500)
            ->get();

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

        // Verify employee belongs to the same company
        $employee = Employee::where('company_id', $this->companyId())
            ->find($request->employee_id);

        if (! $employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found in your company',
            ], 404);
        }

        // Verify geofence belongs to the same company and the user is within its radius
        $geofence = Geofence::where('company_id', $this->companyId())
            ->active()
            ->find($request->geofence_id);

        if (! $geofence) {
            return response()->json([
                'success' => false,
                'message' => 'Geofence not found in your company',
            ], 422);
        }

        $distance = $this->haversineDistance(
            (float) $request->lat,
            (float) $request->lng,
            (float) $geofence->lat,
            (float) $geofence->lng
        );

        if ($distance > ($geofence->radius + self::GEOFENCE_DISTANCE_BUFFER_METERS)) {
            return response()->json([
                'success' => false,
                'message' => 'Check-in location is outside the allowed geofence area',
            ], 422);
        }

        $existing = Attendance::where('employee_id', $request->employee_id)
            ->where('date', $today)
            ->first();

        if ($existing && in_array($existing->status, ['present', 'late'])) {
            return response()->json([
                'success' => false,
                'message' => 'Already checked in today',
                'data' => new AttendanceResource($existing->load(['employee', 'geofence'])),
            ], 409);
        }

        $checkInTime = now()->format('H:i');
        $lateThresholdHour = (int) config('trax.late_threshold_hour', 9);
        $lateThresholdMin = (int) config('trax.late_threshold_minute', 0);
        $threshold = now()->setTime($lateThresholdHour, $lateThresholdMin);
        $isLate = now()->gt($threshold);

        if ($existing) {
            $existing->update([
                'check_in_time' => $checkInTime,
                'check_in_lat' => $request->lat,
                'check_in_lng' => $request->lng,
                'geofence_id' => $request->geofence_id,
                'status' => $isLate ? 'late' : 'present',
                'late_minutes' => $isLate ? now()->diffInMinutes($threshold) : 0,
                'check_out_time' => null,
                'check_out_lat' => null,
                'check_out_lng' => null,
                'worked_hours' => 0,
            ]);
            $record = $existing;
        } else {
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
        }

        if ($request->filled('battery_level')) {
            $record->employee?->update(['battery_level' => $request->battery_level]);
        }

        try {
            Cache::tags(['attendance', 'dashboard'])->flush();
        } catch (\Throwable) {
        }

        try {
            event(new AttendanceCheckedIn(
                $record->employee_id,
                $record->employee?->name ?? 'Unknown',
                $record->date,
                $record->check_in_time?->format('H:i'),
                $record->status,
                $record->geofence?->name
            ));
        } catch (\Throwable) {
        }

        return response()->json([
            'success' => true,
            'message' => 'Check-in successful',
            'data' => new AttendanceResource($record->load(['employee', 'geofence'])),
        ], 201);
    }

    public function checkOut(CheckOutRequest $request): JsonResponse
    {
        $today = now()->toDateString();

        // Verify employee belongs to the same company
        $employee = Employee::where('company_id', $this->companyId())
            ->find($request->employee_id);

        if (! $employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found in your company',
            ], 404);
        }

        $record = Attendance::where('employee_id', $request->employee_id)
            ->where('date', $today)
            ->first();

        if (! $record) {
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

        try {
            Cache::tags(['attendance', 'dashboard'])->flush();
        } catch (\Throwable) {
        }

        try {
            event(new AttendanceCheckedOut(
                $record->employee_id,
                $record->employee?->name ?? 'Unknown',
                $record->date,
                $checkOutTime,
                $record->status,
                $record->geofence?->name
            ));
        } catch (\Throwable) {
        }

        return response()->json([
            'success' => true,
            'message' => 'Check-out successful',
            'data' => new AttendanceResource($record->load(['employee', 'geofence'])),
        ]);
    }

    private function calculateWorkedHours(string $checkIn, string $checkOut): float
    {
        $start = Carbon::parse($checkIn);
        $end = Carbon::parse($checkOut);

        if ($end->lt($start)) {
            $end->addDay();
        }

        return round($start->diffInMinutes($end) / 60, 2);
    }
}
