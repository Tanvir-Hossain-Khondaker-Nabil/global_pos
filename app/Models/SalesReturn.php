<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class SalesReturn extends Model
{
      protected $fillable = [
        'sale_id',
        'customer_id',
        'refunded_amount',
        'shadow_refunded_amount',
        'return_type',
        'status',
        'return_date',
        'reason',
        'notes',
        'created_by',
        'replacement_total',
        'shadow_replacement_total',
        'type',
        'return_quantity'
    ];


    //relation to sale
    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id')->with('warehouse');
    }

    //relation to customer
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }


    //scope for searching by invoice number
    public function scopeSearchByInvoice($query, $search)
    {
        if (!$search) return $query;

        return $query->whereHas('sale', function ($q) use ($search) {
            $q->where('invoice_no', 'like', "%{$search}%");
        });
    }


    public function scopeSearchByCustomer($query, $search)
    {
        if (!$search) return $query;

        return $query->whereHas('customer', function ($q) use ($search) {
            $q->where('customer_name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%");
        });
    }

    public function scopeSearch($query, $search)
    {
        if (!$search) return $query;

        return $query->where(function ($q) use ($search) {
            $q->searchByInvoice($search)
                ->orWhere(function ($q2) use ($search) {
                    $q2->searchByCustomer($search);
                });
        });
    }

    public function scopeStatus($query, $status)
    {
        if (!$status) return $query;

        return $query->where('status', $status);
    }


    public function scopeDateBetween($query, $from, $to)
    {
        if (!$from || !$to) return $query;

        return $query->whereBetween('created_at', [
            Carbon::parse($from)->startOfDay(),
            Carbon::parse($to)->endOfDay(),
        ]);
    }


    public function scopeType($query, $type)
    {
        if (!$type) return $query;

        return $query->where('type', $type);
    }
}
