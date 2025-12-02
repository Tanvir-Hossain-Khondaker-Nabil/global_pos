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
        return $this->belongsTo(Sale::class)->with('items.product', 'customer');
    }


    public function purchase()
    {
        return $this->belongsTo(Purchase::class)->with('items.product', 'customer');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }


    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }



}
