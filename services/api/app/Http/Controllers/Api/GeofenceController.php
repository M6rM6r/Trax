<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGeofenceRequest;
use App\Http\Requests\UpdateGeofenceRequest;
use App\Http\Resources\GeofenceResource;
use App\Models\Geofence;
use App\Traits\GeoDistance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GeofenceController extends Controller
{
    use GeoDistance;
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

        $firebaseService = app(\App\Services\FirebaseUserService::class);
        $firebaseService->updateGeofence(
            (string) $geofence->id,
            array_merge(
                (new GeofenceResource($geofence))->toArray($request),
                ['company_id' => (string) $this->companyId()]
            )
        );

        return response()->json(['success' => true, 'message' => 'Geofence created', 'data' => new GeofenceResource($geofence)], 201);
    }

    public function update(UpdateGeofenceRequest $request, int $id): JsonResponse
    {
        $geofence = Geofence::where('company_id', $this->companyId())->find($id);

        if (! $geofence) {
            return response()->json(['success' => false, 'message' => 'Geofence not found'], 404);
        }

        $geofence->update($request->validated());

        $firebaseService = app(\App\Services\FirebaseUserService::class);
        $firebaseService->updateGeofence(
            (string) $geofence->id,
            array_merge(
                (new GeofenceResource($geofence))->toArray($request),
                ['company_id' => (string) $this->companyId()]
            )
        );

        return response()->json(['success' => true, 'message' => 'Geofence updated', 'data' => new GeofenceResource($geofence)]);
    }

    public function destroy(int $id): JsonResponse
    {
        $geofence = Geofence::where('company_id', $this->companyId())->find($id);

        if (! $geofence) {
            return response()->json(['success' => false, 'message' => 'Geofence not found'], 404);
        }

        $geofence->delete();

        app(\App\Services\FirebaseUserService::class)->deleteGeofence((string) $id);

        return response()->json(['success' => true, 'message' => 'Geofence deleted']);
    }

    public function checkInside(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'geofence_id' => ['required', 'integer', Rule::exists('geofences', 'id')->where(fn ($q) => $q->where('company_id', $this->companyId()))],
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

}
