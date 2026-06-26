<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = [
        'name', 'slug', 'logo', 'industry', 'address', 'phone',
        'plan', 'max_employees', 'trial_ends_at', 'active', 'settings',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'active' => 'boolean',
        'settings' => 'array',
        'max_employees' => 'integer',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function geofences(): HasMany
    {
        return $this->hasMany(Geofence::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function isTrialExpired(): bool
    {
        return $this->plan === 'trial' && $this->trial_ends_at?->isPast();
    }

    public function canAddMoreEmployees(): bool
    {
        return $this->employees()->count() < $this->max_employees;
    }

    public static function generateSlug(string $name): string
    {
        $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $name));
        $slug = trim($slug, '-');
        $base = $slug;
        $i = 1;
        while (static::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }
        return $slug;
    }
}
