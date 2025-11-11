<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'sale_id',
        'amount',
        'payment_method',
        'txn_ref',
        'note',
        'customer_id',
        'paid_at',
        'shadow_amount',
        'status',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class)->with('items.product', 'customer');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
