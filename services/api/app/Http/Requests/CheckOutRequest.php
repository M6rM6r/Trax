<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckOutRequest extends FormRequest
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
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'The employee ID is required.',
            'employee_id.exists' => 'The selected employee does not exist in your company.',
        ];
    }
}
