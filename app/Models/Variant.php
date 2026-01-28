<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Contracts\Database\Query\Builder;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Variant extends Model
{
    protected $fillable = ['product_id', 'attribute_values', 'sku', 'outlet_id', 'created_by','owner_id'];

    protected $casts = [
        'attribute_values' => 'array',
    ];

    use BelongsToTenant;

    // Always load stock relationship
    protected $with = ['stock'];

    // Append computed attributes to JSON
    protected $appends = ['stock_quantity', 'stock_sale_price', 'variant_name'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function stock(): HasOne
    {
        return $this->hasOne(Stock::class, 'variant_id', 'id');
    }

    public function stocks(): HasOne
    {
        return $this->hasOne(Stock::class, 'variant_id', 'id');
    }

    // Remove duplicate stocks() method if it's the same as stock()
    // public function stocks(): HasOne
    // {
    //     return $this->hasOne(Stock::class, 'variant_id', 'id');
    // }

    // Helper method to get attribute values as string
    public function getVariantNameAttribute(): string
    {
        if (empty($this->attribute_values)) {
            return 'Default Variant';
        }

        return collect($this->attribute_values)
            ->map(fn($value, $attribute) => "{$attribute}: {$value}")
            ->join(', ');
    }

    // Helper method to get stock quantity
    public function getStockQuantityAttribute()
    {
        return $this->stock ? $this->stock->quantity : 0;
    }

    // Helper method to get sale price
    public function getStockSalePriceAttribute()
    {
        return $this->stock ? $this->stock->sale_price : 0;
    }

    // Remove duplicate getSalePriceAttribute() since we have getStockSalePriceAttribute()
    // public function getSalePriceAttribute()
    // {
    //     return $this->stock ? $this->stock->sale_price : 0;
    // }

    // Custom toArray method if needed (optional)
    public function toArray()
    {
        $array = parent::toArray();

        // You can customize what gets returned here if needed
        return array_merge($array, [
            'variant_name' => $this->variant_name,
            'stock_quantity' => $this->stock_quantity,
            'stock_sale_price' => $this->stock_sale_price,
        ]);
    }
}