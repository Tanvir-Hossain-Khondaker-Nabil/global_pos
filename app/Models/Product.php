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
        'brand_id',
        'description',
        'created_by',
        'product_type',
        'in_house_cost',
        'in_house_shadow_cost',
        'in_house_sale_price',
        'in_house_shadow_sale_price',
        'in_house_initial_stock',
    ];

    protected $casts = [
        'in_house_cost' => 'decimal:2',
        'in_house_shadow_cost' => 'decimal:2',
        'in_house_sale_price' => 'decimal:2',
        'in_house_shadow_sale_price' => 'decimal:2',
        'in_house_initial_stock' => 'integer',
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
                    ->orWhereHas('brand', function ($query) use ($search) {
                        $query->where('name', 'like', '%' . $search . '%');
                    })
                    ->orWhereHas('variants', function ($query) use ($search) {
                        $query->where('sku', 'like', '%' . $search . '%')
                            ->orWhereJsonContains('attribute_values', $search);
                    });
            });
        });
    }

    // This method might not be needed, but keep it if you use it elsewhere
    public function getTotalStockAttribute()
    {
        if (!$this->relationLoaded('variants')) {
            return 0;
        }
        
        return $this->variants->sum(function($variant) {
            if ($variant->relationLoaded('stock')) {
                return $variant->stock ? $variant->stock->quantity : 0;
            }
            return 0;
        });
    }
}