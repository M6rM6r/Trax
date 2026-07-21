<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGeofenceRequest;
use App\Http\Requests\UpdateGeofenceRequest;
use App\Http\Resources\GeofenceResource;
use App\Models\Geofence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeofenceController extends Controller
{
    private function companyId(): int
    {
        return (int) (auth()->user()?->company_id ?? 0);
    }

    public function index(): JsonResponse
    {
        $geofences = Geofence::where('company_id', $this->companyId())->withCount('employees')->get();

        return response()->json(['success' => true, 'data' => GeofenceResource::collection($geofences)]);
    }

    public function show(int $id): JsonResponse
    {
        $geofence = Geofence::where('company_id', $this->companyId())->withCount('employees')->find($id);

        if (! $geofence) {
            return response()->json(['success' => false, 'message' => 'Geofence not found'], 404);
        }

        return response()->json(['success' => true, 'data' => new GeofenceResource($geofence)]);
    }

    public function store(StoreGeofenceRequest $request): JsonResponse
    {
        $geofence = Geofence::create(array_merge($request->validated(), ['company_id' => $this->companyId()]));

        return response()->json(['success' => true, 'message' => 'Geofence created', 'data' => new GeofenceResource($geofence)], 201);
    }

    public function update(UpdateGeofenceRequest $request, int $id): JsonResponse
    {
        $geofence = Geofence::where('company_id', $this->companyId())->find($id);

        if (! $geofence) {
            return response()->json(['success' => false, 'message' => 'Geofence not found'], 404);
        }

        $geofence->update($request->validated());

        return response()->json(['success' => true, 'message' => 'Geofence updated', 'data' => new GeofenceResource($geofence)]);
    }

    public function destroy(int $id): JsonResponse
    {
        $geofence = Geofence::where('company_id', $this->companyId())->find($id);

        if (! $geofence) {
            return response()->json(['success' => false, 'message' => 'Geofence not found'], 404);
        }

        $geofence->delete();

        return response()->json(['success' => true, 'message' => 'Geofence deleted']);
    }

    public function checkInside(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'geofence_id' => 'required|exists:geofences,id',
        ]);

        $geofence = Geofence::where('company_id', $this->companyId())->find($validated['geofence_id']);

        if (! $geofence) {
            return response()->json(['success' => false, 'message' => 'Geofence not found'], 404);
        }

        $distance = $this->haversineDistance(
            $validated['lat'],
            $validated['lng'],
            $geofence->lat,
            $geofence->lng
        );

        return response()->json([
            'success' => true,
            'data' => [
                'inside' => $distance <= $geofence->radius,
                'distance' => round($distance, 2),
                'geofence_radius' => $geofence->radius,
            ],
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
