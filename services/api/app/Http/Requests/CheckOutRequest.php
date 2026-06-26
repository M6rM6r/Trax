<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckOutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'The employee ID is required.',
            'employee_id.exists' => 'The selected employee does not exist.',
        ];
    }
}
