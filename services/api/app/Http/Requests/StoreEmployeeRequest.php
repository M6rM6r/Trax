<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email', 'unique:employees,email', 'unique:users,email'],
            'employeeNumber' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('users', 'username')->where(
                    fn ($query) => $query->where('company_id', $this->user()?->company_id)
                ),
            ],
            'phone' => ['required', 'string', 'max:20'],
            'role' => ['required', 'in:manager,employee,supervisor'],
            'department' => ['required', 'string', 'max:255'],
            'geofence_id' => ['nullable', 'exists:geofences,id'],
            'geofenceId' => ['nullable', 'integer'],
            'avatar' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,inactive'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'The name field is required.',
            'name.min' => 'The name must be at least 2 characters.',
            'email.required' => 'The email field is required.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email is already registered.',
            'phone.required' => 'The phone field is required.',
            'role.required' => 'The role field is required.',
            'role.in' => 'The role must be manager, employee, or supervisor.',
            'department.required' => 'The department field is required.',
            'password.required' => 'A password is required for the employee to log in.',
            'password.min' => 'Password must be at least 8 characters.',
        ];
    }
}
