<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'role',
        'department',
        'avatar',
        'geofence_id',
        'status',
        'current_lat',
        'current_lng',
        'last_seen',
    ];

    protected $casts = [
        'current_lat' => 'float',
        'current_lng' => 'float',
        'last_seen' => 'datetime',
    ];

    public function geofence(): BelongsTo
    {
        return $this->belongsTo(Geofence::class);
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
}
