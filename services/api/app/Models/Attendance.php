<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = [
        'employee_id',
        'date',
        'check_in_time',
        'check_out_time',
        'check_in_lat',
        'check_in_lng',
        'geofence_id',
        'status',
        'late_minutes',
        'worked_hours',
    ];

    protected $casts = [
        'date' => 'date',
        'check_in_lat' => 'float',
        'check_in_lng' => 'float',
        'late_minutes' => 'integer',
        'worked_hours' => 'float',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function geofence(): BelongsTo
    {
        return $this->belongsTo(Geofence::class);
    }
}
