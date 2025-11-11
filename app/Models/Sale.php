<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = [
        'customer_id',
        'invoice_no',
        'sub_total',
        'discount',
        'vat_tax',
        'grand_total',
        'paid_amount',
        'due_amount',
        'payment_type',
        'status',
        'type',
        'shadow_sub_total',
        'shadow_discount',
        'shadow_vat_tax',
        'shadow_grand_total',
        'shadow_paid_amount',
        'shadow_due_amount',
        'shadow_type',
    ];


    //relation to customer
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }


    // relation to sale items
    public function items()
    {
        return $this->hasMany(SaleItem::class, 'sale_id')->with('product', 'variant');
    }

    //payments relation
    public function payments()  
    {
        return $this->hasMany(Payment::class, 'sale_id');
    }

    


}
