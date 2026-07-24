<?php

namespace App\Http\Controllers\Api;

use App\Events\EmployeeLocationUpdated;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Traits\GeoDistance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    use GeoDistance;
    private function companyId(): int
    {
        return (int) (auth()->user()?->company_id ?? 0);
    }

    public function live(): JsonResponse
    {
        $employees = Employee::with('geofence')
            ->where('company_id', $this->companyId())
            ->where('status', 'active')
            ->whereNotNull('current_lat')
            ->whereNotNull('current_lng')
            ->get();

        $data = $employees->map(function ($employee) {
            $geofence = $employee->geofence;
            $isInside = false;

            if ($geofence && $employee->current_lat && $employee->current_lng) {
                $distance = $this->haversineDistance(
                    $employee->current_lat,
                    $employee->current_lng,
                    $geofence->lat,
                    $geofence->lng
                );
                $isInside = $distance <= $geofence->radius;
            }

            $status = 'offline';
            if ($employee->last_seen && $employee->last_seen->gt(now()->subMinutes(5))) {
                $status = $isInside ? 'inside_geofence' : 'outside_geofence';
            }

            return [
                'id' => $employee->id,
                'name' => $employee->name,
                'lat' => $employee->current_lat,
                'lng' => $employee->current_lng,
                'status' => $status,
                'geofenceName' => $geofence?->name,
                'lastSeen' => $employee->last_seen?->toIso8601String(),
                'batteryLevel' => $employee->battery_level,
                'role' => $employee->role,
                'avatar' => $employee->avatar,
                'speed' => null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function updateLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['nullable', 'integer'],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'battery_level' => ['nullable', 'integer', 'between:0,100'],
            'timestamp' => ['nullable', 'string', 'max:80'],
        ]);

        $user = auth()->user();
        $linkedEmployee = Employee::where('company_id', $this->companyId())
            ->where(function ($q) use ($user) {
                $q->where('email', $user->email);
                if (! empty($user->username)) {
                    $q->orWhere('employee_number', $user->username);
                }
            })
            ->first();

        $targetEmployeeId = $validated['employee_id'] ?? $linkedEmployee?->id;

        if (! $targetEmployeeId) {
            return response()->json([
                'success' => false,
                'message' => 'Employee link not found for current user',
            ], 422);
        }

        if (($user->role ?? null) === 'employee' && $linkedEmployee && $targetEmployeeId !== $linkedEmployee->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update your own location',
            ], 403);
        }

        $employee = Employee::with('geofence')
            ->where('company_id', $this->companyId())
            ->find($targetEmployeeId);

        if (! $employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found',
            ], 404);
        }

        $maxTrackingAccuracyMeters = 1000;
        if (array_key_exists('accuracy', $validated)
            && $validated['accuracy'] !== null
            && (float) $validated['accuracy'] > $maxTrackingAccuracyMeters
        ) {
            return response()->json([
                'success' => true,
                'data' => [
                    'employeeId' => $employee->id,
                    'skipped' => true,
                    'reason' => 'low_accuracy',
                    'accuracy' => (float) $validated['accuracy'],
                    'maxAllowedAccuracy' => $maxTrackingAccuracyMeters,
                    'serverTime' => now()->toIso8601String(),
                ],
            ]);
        }

        $employee->current_lat = $validated['lat'];
        $employee->current_lng = $validated['lng'];
        $employee->last_seen = now();
        if (array_key_exists('battery_level', $validated)) {
            $employee->battery_level = $validated['battery_level'];
        }
        $employee->save();

        $geofence = $employee->geofence;
        $isInside = false;
        $distance = null;

        if ($geofence) {
            $distance = $this->haversineDistance(
                (float) $employee->current_lat,
                (float) $employee->current_lng,
                (float) $geofence->lat,
                (float) $geofence->lng
            );
            $isInside = $distance <= (float) $geofence->radius;
        }

        $status = $isInside ? 'inside_geofence' : 'outside_geofence';

        try {
            event(new EmployeeLocationUpdated(
                (int) $employee->id,
                (string) $employee->name,
                (float) $employee->current_lat,
                (float) $employee->current_lng,
                $status,
                $geofence?->name,
                (string) $employee->last_seen->toIso8601String(),
                $employee->battery_level
            ));
        } catch (\Throwable) {
            // Do not fail location heartbeat if broadcast transport is unavailable.
        }

        return response()->json([
            'success' => true,
            'data' => [
                'employeeId' => $employee->id,
                'lat' => $employee->current_lat,
                'lng' => $employee->current_lng,
                'accuracy' => $validated['accuracy'] ?? null,
                'status' => $status,
                'geofenceName' => $geofence?->name,
                'distance' => $distance !== null ? round($distance, 2) : null,
                'lastSeen' => $employee->last_seen->toIso8601String(),
                'serverTime' => now()->toIso8601String(),
            ],
        ]);
    }

}
