<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Scopes\UserScope;

class Warehouse extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'address',
        'phone',
        'email',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }

    public function getTotalProductsAttribute()
    {
        return $this->stocks()->distinct('product_id')->count();
    }

    public function getTotalStockValueAttribute()
    {
        return $this->stocks()->get()->reduce(function ($carry, $stock) {
            return $carry + ($stock->quantity * $stock->purchase_price);
        }, 0);
    }

    public function scopeFilter($query, array $filters)
    {
        // Example filters: ['search' => 'abc', 'is_active' => true]
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('code', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('address', 'like', '%' . $filters['search'] . '%');
            });
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query;
    }

}