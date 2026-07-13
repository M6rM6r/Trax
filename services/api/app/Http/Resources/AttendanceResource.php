<?php

namespace App\Http\Resources;

use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Attendance
 */
class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employeeId' => $this->employee_id,
            'employeeName' => $this->whenLoaded('employee', fn () => $this->employee->name),
            'date' => $this->date->format('Y-m-d'),
            'checkInTime' => $this->check_in_time?->format('H:i'),
            'checkOutTime' => $this->check_out_time?->format('H:i'),
            'status' => $this->status,
            'lateMinutes' => $this->late_minutes,
            'workedHours' => $this->worked_hours,
            'geofenceName' => $this->whenLoaded('geofence', fn () => $this->geofence->name),
            'checkInLat' => $this->check_in_lat,
            'checkInLng' => $this->check_in_lng,
            'checkOutStatus' => $this->check_out_status,
        ];
    }
}
