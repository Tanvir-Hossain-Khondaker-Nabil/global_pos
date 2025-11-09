<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Variant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'size',
        'color',
        'price',
        'stock'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Add this accessor
    public function getVariantNameAttribute()
    {
        $parts = [];
        if ($this->size)
            $parts[] = "Size: {$this->size}";
        if ($this->color)
            $parts[] = "Color: {$this->color}";

        return implode(', ', $parts) ?: 'Default Variant';
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }

    // Stock relationship যোগ করুন
    public function stock()
    {
        return $this->hasOne(Stock::class, 'variant_id');
    }

    // Helper method to get stock quantity
    public function getStockQuantityAttribute()
    {
        return $this->stock ? $this->stock->quantity : 0;
    }

    // Helper method to get purchase price
    public function getPurchasePriceAttribute()
    {
        return $this->stock ? $this->stock->purchase_price : 0;
    }

    // Helper method to get sale price
    public function getSalePriceAttribute()
    {
        return $this->stock ? $this->stock->sale_price : 0;
    }
}