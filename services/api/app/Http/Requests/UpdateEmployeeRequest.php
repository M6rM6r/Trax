<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $employeeId = $this->route('employee')?->id ?? $this->route('employee');
        $companyId = $this->user()?->company_id;

        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:employees,email,'.$employeeId],
            'employeeNumber' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'phone' => ['sometimes', 'string', 'max:20'],
            'role' => ['sometimes', 'in:manager,employee,supervisor'],
            'department' => ['sometimes', 'string', 'max:255'],
            'geofence_id' => ['nullable', 'integer', Rule::exists('geofences', 'id')->where(fn ($q) => $q->where('company_id', $companyId))],
            'avatar' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }
}
