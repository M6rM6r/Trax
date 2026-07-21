<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EmployeeLocationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $employeeId,
        public string $employeeName,
        public float $lat,
        public float $lng,
        public string $status,
        public ?string $geofenceName,
        public string $lastSeen,
        public ?int $batteryLevel
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('tracking.live'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'employee:location_updated';
    }

    public function broadcastWith(): array
    {
        return [
            'employeeId' => $this->employeeId,
            'employeeName' => $this->employeeName,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'status' => $this->status,
            'geofenceName' => $this->geofenceName,
            'lastSeen' => $this->lastSeen,
            'batteryLevel' => $this->batteryLevel,
        ];
    }
}
