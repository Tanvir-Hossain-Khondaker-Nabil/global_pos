<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_return_id',
        'purchase_item_id',
        'product_id',
        'variant_id',
        'return_quantity',
        'unit_price',
        'shadow_unit_price',
        'sale_price',
        'shadow_sale_price',
        'total_price',
        'shadow_total_price',
        'reason',
        'status'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'shadow_unit_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'shadow_sale_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'shadow_total_price' => 'decimal:2',
    ];

    public function purchaseReturn()
    {
        return $this->belongsTo(PurchaseReturn::class);
    }

    public function purchaseItem()
    {
        return $this->belongsTo(PurchaseItem::class);
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