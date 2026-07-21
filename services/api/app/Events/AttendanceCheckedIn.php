<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttendanceCheckedIn implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $employeeId,
        public string $employeeName,
        public string $date,
        public ?string $checkInTime,
        public string $status,
        public ?string $geofenceName
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('attendance.events'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'attendance:checked_in';
    }

    public function broadcastWith(): array
    {
        return [
            'employeeId' => $this->employeeId,
            'employeeName' => $this->employeeName,
            'date' => $this->date,
            'checkInTime' => $this->checkInTime,
            'status' => $this->status,
            'geofenceName' => $this->geofenceName,
        ];
    }
}
