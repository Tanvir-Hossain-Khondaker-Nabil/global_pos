<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Scopes\UserScope;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'product_no',
        'category_id',
        'description',
        'created_by',
        'brand_id',
    ];

    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function variants()
    {
        return $this->hasMany(Variant::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }


    // Calculate total stock
    public function getTotalStockAttribute()
    {
        return $this->variants->sum(function($variant) {
            return $variant->stock ? $variant->stock->quantity : 0;
        });
    }

    // Get price range
    public function getPriceRangeAttribute()
    {
        $prices = $this->variants->pluck('price')->filter();
        if ($prices->isEmpty())
            return null;

        $min = $prices->min();
        $max = $prices->max();

        return $min === $max ? "₹{$min}" : "₹{$min} - ₹{$max}";
    }

    // Scope for filtering
    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('product_no', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%')
                    ->orWhereHas('category', function ($query) use ($search) {
                        $query->where('name', 'like', '%' . $search . '%');
                    })
                    ->orWhereHas('variants', function ($query) use ($search) {
                        $query->where('sku', 'like', '%' . $search . '%')
                            ->orWhereJsonContains('attribute_values', $search);
                    });
            });
        });
    }

    public function stocks()
    {
        return $this->hasManyThrough(Stock::class, Variant::class);
    }

    // Remove these relationships as they might cause conflicts
    // public function attributeValue()
    // {
    //     return $this->hasMany(AttributeValue::class);
    // }
    
    // public function stock()
    // {
    //     return $this->hasOne(Stock::class, 'variant_id');
    // }

    // Remove getProductAttributes as it's not needed with current structure
    // public function getProductAttributes()
    // {
    //     return Attribute::whereIn('id', function($query) {
    //         $query->select('attribute_id')
    //               ->from('product_variant_attributes')
    //               ->whereIn('product_variant_id', function($q) {
    //                   $q->select('id')
    //                     ->from('product_variants')
    //                     ->where('product_id', $this->id);
    //               });
    //     })->get();
    // }
}