<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;


class Customer extends Model
{

    protected $fillable = [
        'customer_name',
        'address',
        'phone',
        'is_active',
        'advance_amount',
        'due_amount',
        'created_by',
        'outlet_id',
        'owner_id'
    ];

    use BelongsToTenant;

    const IS_ACTIVE = 1;


    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }
    }


    //relations ship to sales
    public function sales()
    {
        return $this->hasMany(Sale::class, 'customer_id')->with(['creator','items','payments']);
    }

    //user relation
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    //active scrope 
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
}
