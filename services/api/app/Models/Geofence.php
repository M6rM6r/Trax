<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Geofence extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'address',
        'lat',
        'lng',
        'radius',
        'color',
        'active',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
        'radius' => 'float',
        'active' => 'boolean',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('active', false);
    }
}
