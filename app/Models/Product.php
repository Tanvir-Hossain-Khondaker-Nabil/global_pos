<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere("product_no", "like", "%{$search}%")
                    ->orWhere("gross_price", "like", "%{$search}%")
                    ->orWhere("discount", "like", "%{$search}%");
            });
        }
    }


    public function category()
    {
        return $this->belongsTo(Category::class, "category_id");
    }

    // Product এর size rows
    public function sizes()
    {
        return $this->hasMany(Variant::class)->whereNull('parent_id');
    }
}
