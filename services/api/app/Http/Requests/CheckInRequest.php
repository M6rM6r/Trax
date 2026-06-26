<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'geofence_id' => ['required', 'exists:geofences,id'],
            'timestamp' => ['nullable', 'string'],
            'battery_level' => ['nullable', 'integer', 'between:0,100'],
        ];
    }
}
