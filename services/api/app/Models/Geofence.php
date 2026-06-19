<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Geofence extends Model
{
    protected $fillable = [
        'name',
        'address',
        'lat',
        'lng',
        'radius',
        'color',
        'active',
    ];

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
}
