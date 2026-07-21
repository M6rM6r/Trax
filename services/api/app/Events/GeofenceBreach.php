<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GeofenceBreach implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $employeeId,
        public string $employeeName,
        public string $geofenceName,
        public float $distance,
        public string $timestamp
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('tracking.geofence'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'geofence:breach';
    }

    public function broadcastWith(): array
    {
        return [
            'employeeId' => $this->employeeId,
            'employeeName' => $this->employeeName,
            'geofenceName' => $this->geofenceName,
            'distance' => $this->distance,
            'timestamp' => $this->timestamp,
        ];
    }
}
