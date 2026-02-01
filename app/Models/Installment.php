<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Installment extends Model
{
    protected $fillable = [
        'sale_id',
        'purchase_id',
        'installment_no',
        'amount',
        'due_date',
        'paid_amount',
        'paid_date',
        'status',
    ];


    // relations
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }
}
