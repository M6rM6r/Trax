<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnomalyDetected implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $employeeId,
        public bool $isAnomaly,
        public float $anomalyScore,
        public string $details
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('ai.anomalies'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'anomaly:detected';
    }

    public function broadcastWith(): array
    {
        return [
            'employeeId' => $this->employeeId,
            'isAnomaly' => $this->isAnomaly,
            'anomalyScore' => $this->anomalyScore,
            'details' => $this->details,
        ];
    }
}
