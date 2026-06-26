<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Geofence;
use Illuminate\Http\JsonResponse;

class TrackingController extends Controller
{
    public function live(): JsonResponse
    {
        $employees = Employee::with('geofence')
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

    private function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
