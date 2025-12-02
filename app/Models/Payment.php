<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Scopes\UserScope;

class Payment extends Model
{
    protected $fillable = [
        'sale_id',
        'purchase_id',
        'amount',
        'payment_method',
        'txn_ref',
        'note',
        'customer_id',
        'supplier_id',
        'paid_at',
        'shadow_amount',
        'status',
        'created_by',
    ];


    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }


    public function scopeSearch($query, $term)
    {
        if (!$term) return $query;

        return $query->where(function ($q) use ($term) {
            $q->where('payment_method', 'like', "%{$term}%")
            ->orWhere('txn_ref', 'like', "%{$term}%")
            ->orWhere('note', 'like', "%{$term}%")
            ->orWhereHas('customer', function ($q2) use ($term) {
                $q2->where('customer_name', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%");
            })
            ->orWhereHas('supplier', function ($q2) use ($term) {
                $q2->where('name', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%");
            });
            // ->orWhereHas('sale', function ($q3) use ($term) {
            //     $q3->where('invoice_no', 'like', "%{$term}%");
            // })
            // ->orWhereHas('purchase', function ($q4) use ($term) {
            //     $q4->where('invoice_no', 'like', "%{$term}%");
            // });
        });
    }




}
