<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'department' => $this->department,
            'avatar' => $this->avatar,
            'geofenceId' => $this->geofence_id,
            'geofenceName' => $this->whenLoaded('geofence', fn() => $this->geofence->name),
            'status' => $this->status,
            'currentLat' => $this->current_lat,
            'currentLng' => $this->current_lng,
            'batteryLevel' => $this->battery_level,
            'lastSeen' => $this->last_seen?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
