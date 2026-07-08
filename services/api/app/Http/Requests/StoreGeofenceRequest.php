<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGeofenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'nullable', 'string', 'min:2', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'radius' => ['required', 'numeric', 'min:1', 'max:10000'],
            'color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'active' => ['boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $name = is_string($this->input('name')) ? trim($this->input('name')) : '';
        $address = is_string($this->input('address')) ? trim($this->input('address')) : '';

        $lat = $this->input('lat');
        $lng = $this->input('lng');

        $fallbackName = sprintf('نطاق %s', now()->format('Ymd-His'));
        $fallbackAddress = sprintf('Map pin (%s, %s)', $lat, $lng);

        $this->merge([
            'name' => $name !== '' ? $name : $fallbackName,
            'address' => $address !== '' ? $address : $fallbackAddress,
        ]);
    }

    public function messages(): array
    {
        return [
            'lat.required' => 'Latitude is required.',
            'lat.between' => 'Latitude must be between -90 and 90.',
            'lng.required' => 'Longitude is required.',
            'lng.between' => 'Longitude must be between -180 and 180.',
            'radius.required' => 'Radius is required.',
            'radius.min' => 'Radius must be at least 1 meter.',
            'color.regex' => 'Color must be a valid hex color (e.g. #3C7EE7).',
        ];
    }
}
