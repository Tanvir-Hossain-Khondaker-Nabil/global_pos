<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'product_no',
        'category_id',
        'description'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function variants()
    {
        return $this->hasMany(Variant::class);
    }

    // Calculate total stock
    public function getTotalStockAttribute()
    {
        return $this->variants->sum('stock');
    }

    // Get price range
    public function getPriceRangeAttribute()
    {
        $prices = $this->variants->pluck('price')->filter();
        if ($prices->isEmpty()) return null;
        
        $min = $prices->min();
        $max = $prices->max();
        
        return $min === $max ? "₹{$min}" : "₹{$min} - ₹{$max}";
    }

    // Scope for filtering
    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', '%'.$search.'%')
                      ->orWhere('product_no', 'like', '%'.$search.'%')
                      ->orWhere('description', 'like', '%'.$search.'%')
                      ->orWhereHas('category', function ($query) use ($search) {
                          $query->where('name', 'like', '%'.$search.'%');
                      })
                      ->orWhereHas('variants', function ($query) use ($search) {
                          $query->where('size', 'like', '%'.$search.'%')
                                ->orWhere('color', 'like', '%'.$search.'%');
                      });
            });
        });
    }
}