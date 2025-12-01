<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'product_id',
        'variant_id',
        'quantity',
        'unit_price',
        'shadow_unit_price',
        'total_price',
        'shadow_total_price',
        'sale_price',
        'shadow_sale_price',
        'created_by',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'shadow_unit_price' => 'decimal:2', // Add this
        'total_price' => 'decimal:2',
        'shadow_total_price' => 'decimal:2' // Add this
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(Variant::class);
    }
}