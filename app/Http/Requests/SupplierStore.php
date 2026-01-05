<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SupplierStore extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'contact_person' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'required|string|max:20',
            'company' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'website' => 'nullable|url',
            'advance_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'account_id' => 'nullable|exists:accounts,id',
            'is_active' => 'boolean',
        ];
    }
}
