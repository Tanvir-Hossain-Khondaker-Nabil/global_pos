<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Scopes\UserScope;


class Stock extends Model
{
    use HasFactory;

    protected $fillable = [
        'warehouse_id',
        'product_id',
        'variant_id',
        'quantity',
        'purchase_price',
        'sale_price',
        'shadow_purchase_price', // Add this
        'shadow_sale_price',     // Add this
        'created_by',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'shadow_purchase_price' => 'decimal:2', // Add this
        'shadow_sale_price' => 'decimal:2',     // Add this
    ];


    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(Variant::class);
    }

    public function getStockValueAttribute()
    {
        return $this->quantity * $this->purchase_price;
    }
}