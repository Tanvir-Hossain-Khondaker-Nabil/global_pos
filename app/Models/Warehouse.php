<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
        'outlet_id',
        'owner_id'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    use BelongsToTenant;

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