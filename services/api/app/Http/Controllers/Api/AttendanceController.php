<?php

namespace App\Http\Controllers\Api;

use App\Events\AttendanceCheckedIn;
use App\Events\AttendanceCheckedOut;
use App\Http\Controllers\Controller;
use App\Http\Requests\CheckInRequest;
use App\Http\Requests\CheckOutRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\Attendance;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Geofence;
use App\Traits\GeoDistance;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class AttendanceController extends Controller
{
    use GeoDistance;

    private function companyId(): int
    {
        return (int) (auth()->user()?->company_id ?? 0);
    }

    private function canActOnEmployee(Employee $employee): bool
    {
        $user = auth()->user();

        if (($user->role ?? null) !== 'employee') {
            return true;
        }

        if ($user->firebase_uid && $employee->firebase_uid) {
            return hash_equals($employee->firebase_uid, $user->firebase_uid);
        }

        return $user->company_id === $employee->company_id
            && strcasecmp((string) $user->email, (string) $employee->email) === 0;
    }

    private const GEOFENCE_DISTANCE_BUFFER_METERS = 50;

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

        if (! $this->canActOnEmployee($employee)) {
            return response()->json([
                'success' => false,
                'message' => 'You can only check in for your own employee record.',
            ], 403);
        }

        // Load company geofence policy from Company.settings
        $company = Company::find($this->companyId());
        $companySettings = $company?->settings ?? [];
        $requireGeofence = (bool) ($companySettings['requireGeofenceForCheckIn'] ?? true);
        $allowOutside = (bool) ($companySettings['allowCheckInOutsideGeofence'] ?? false);

        // Resolve geofence if provided (company-scoped + active)
        $geofence = null;
        if ($request->filled('geofence_id')) {
            $geofence = Geofence::where('company_id', $this->companyId())
                ->active()
                ->find($request->geofence_id);

            if (! $geofence) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geofence not found in your company',
                ], 422);
            }
        } else {
            // No geofence provided — block only if policy requires it, outside not allowed, and active geofences exist
            if ($requireGeofence && ! $allowOutside) {
                $hasActive = Geofence::where('company_id', $this->companyId())->active()->exists();
                if ($hasActive) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Geofence is required for check-in',
                    ], 422);
                }
            }
        }

        // Enforce distance only when a geofence is resolved and outside is not permitted
        if ($geofence && ! $allowOutside) {
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

        if (! $this->canActOnEmployee($employee)) {
            return response()->json([
                'success' => false,
                'message' => 'You can only check out from your own employee record.',
            ], 403);
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
