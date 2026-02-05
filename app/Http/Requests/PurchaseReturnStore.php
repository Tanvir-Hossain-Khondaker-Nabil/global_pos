<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseReturnStore extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'purchase_id' => 'required|exists:purchases,id',
            'account_id' => 'nullable|exists:accounts,id',
            'return_type' => 'required|in:money_back,product_replacement',
            'return_date' => 'required|date',
            'reason' => 'required|string|min:3',
            'notes' => 'nullable|string',
            'payment_type' => 'nullable|in:cash,card,mobile_banking,adjust_to_advance',
            'items' => 'required|array|min:1',
            'items.*.purchase_item_id' => 'required|exists:purchase_items,id',
            'items.*.return_quantity' => 'required|integer|min:1',
            'items.*.reason' => 'nullable|string',
            'replacement_products' => 'nullable|array',
            'replacement_products.*.product_id' => 'nullable|exists:products,id',
            'replacement_products.*.variant_id' => 'nullable|exists:variants,id',
            'replacement_products.*.quantity' => 'nullable|integer|min:1',
            'replacement_products.*.unit_price' => 'nullable|numeric|min:0.01',
            'replacement_products.*.shadow_unit_price' => 'nullable|numeric|min:0.01',
            'replacement_products.*.sale_price' => 'nullable|numeric|min:0.01',
            'replacement_products.*.shadow_sale_price' => 'nullable|numeric|min:0.01',
            'replacement_total' => 'nullable|numeric|min:0',
            'shadow_replacement_total' => 'nullable|numeric|min:0',
        ];
    }
}
