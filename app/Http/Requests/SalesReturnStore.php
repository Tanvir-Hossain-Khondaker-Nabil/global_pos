<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SalesReturnStore extends FormRequest
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
            'sale_id' => 'required|exists:sales,id',
            'return_type' => 'required|in:money_back,product_replacement',
            'return_date' => 'required|date',
            'reason' => 'required|string|max:500',
            'notes' => 'nullable|string|max:1000',
            'payment_type' => 'required_if:return_type,money_back|nullable|in:cash,card,mobile_banking,adjust_to_due',
            'refunded_amount' => 'required_if:return_type,money_back|nullable|numeric|min:0',
            'shadow_refunded_amount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.sale_item_id' => 'required|exists:sale_items,id',
            'items.*.return_quantity' => 'required|integer|min:1',
            'items.*.reason' => 'nullable|string|max:255',
            'replacement_products' => 'nullable|array',
            'replacement_products.*.product_id' => 'required|exists:products,id',
            'replacement_products.*.variant_id' => 'nullable|exists:variants,id',
            'replacement_products.*.quantity' => 'required|numeric|min:0.01',
            'replacement_products.*.unit_price' => 'required|numeric|min:0',
            'replacement_products.*.shadow_unit_price' => 'nullable|numeric|min:0',
            'replacement_products.*.sale_price' => 'required|numeric|min:0',
            'replacement_products.*.shadow_sale_price' => 'nullable|numeric|min:0',
        ];
    }
}
