<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class SalesReturn extends Model
{
     protected $fillable = [
        'sales_return_id',
        'sale_item_id',
        'product_id',
        'variant_id',
        'warehouse_id',
        'unit_price',
        'shadow_unit_price',
        'sale_price',
        'shadow_sale_price',
        'total_price',
        'shadow_total_price',
        'return_quantity',
        'reassaon',
        'type',
        'status',
        'created_by',
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
