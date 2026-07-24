<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = $this->user()?->company_id;

        return [
            'employee_id' => ['required', Rule::exists('employees', 'id')->where(fn ($q) => $q->where('company_id', $companyId))],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'geofence_id' => ['nullable', 'integer', Rule::exists('geofences', 'id')->where(fn ($q) => $q->where('company_id', $companyId))],
            'timestamp' => ['nullable', 'string'],
            'battery_level' => ['nullable', 'integer', 'between:0,100'],
        ];
    }
}
