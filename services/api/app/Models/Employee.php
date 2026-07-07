<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'email',
        'employee_number',
        'phone',
        'role',
        'department',
        'avatar',
        'geofence_id',
        'status',
        'current_lat',
        'current_lng',
        'last_seen',
        'battery_level',
        'fcm_token',
        'fcm_platform',
    ];

    protected $casts = [
        'current_lat' => 'float',
        'current_lng' => 'float',
        'last_seen' => 'datetime',
        'battery_level' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function geofence(): BelongsTo
    {
        return $this->belongsTo(Geofence::class);
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('status', 'inactive');
    }

    public function scopeByRole(Builder $query, string $role): Builder
    {
        return $query->where('role', $role);
    }

    public function scopeByDepartment(Builder $query, string $department): Builder
    {
        return $query->where('department', $department);
    }

    public function scopeRecentlySeen(Builder $query, int $minutes = 5): Builder
    {
        return $query->where('last_seen', '>=', now()->subMinutes($minutes));
    }

    public function scopeOnline(Builder $query): Builder
    {
        return $query->whereNotNull('current_lat')
            ->whereNotNull('current_lng')
            ->where('last_seen', '>=', now()->subMinutes(5));
    }
}
