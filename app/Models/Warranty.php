<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warranty extends Model
{
    protected $fillable = [
        'sale_item_id',
        'purchase_item_id',
        'start_date',
        'end_date',
        'terms',
    ];


    //relations model
    const Day = 'day';
    const Month = 'month';
    const Year = 'year';

    public function purchaseItem()
    {
        return $this->belongsTo(PurchaseItem::class, 'purchase_item_id');
    }


    public function salesItem()
    {
        return $this->belongsTo(SaleItem::class, 'sale_item_id');
    }
}
