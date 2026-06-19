<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Geofence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GeofenceController extends Controller
{
    public function index()
    {
        $geofences = Geofence::all();

        return response()->json([
            'success' => true,
            'data' => $geofences,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'radius' => 'required|numeric|min:10|max:1000',
            'color' => 'nullable|string|max:7',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $geofence = Geofence::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Geofence created',
            'data' => $geofence,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $geofence = Geofence::find($id);

        if (!$geofence) {
            return response()->json([
                'success' => false,
                'message' => 'Geofence not found',
            ], 404);
        }

        $geofence->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Geofence updated',
            'data' => $geofence,
        ]);
    }

    public function destroy($id)
    {
        $geofence = Geofence::find($id);

        if (!$geofence) {
            return response()->json([
                'success' => false,
                'message' => 'Geofence not found',
            ], 404);
        }

        $geofence->delete();

        return response()->json([
            'success' => true,
            'message' => 'Geofence deleted',
        ]);
    }

    public function checkInside(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'geofence_id' => 'required|exists:geofences,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $geofence = Geofence::find($request->geofence_id);
        $distance = $this->haversineDistance(
            $request->lat,
            $request->lng,
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
