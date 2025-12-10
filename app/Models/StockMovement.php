<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'warehouse_id',
        'product_id',
        'variant_id',
        'type',
        'qty',
        'reference_type',
        'reference_id',
        'created_by',
    ];


    // relation to warehouse
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }


    // relation to product
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    // relation to variant
    public function variant()
    {
        return $this->belongsTo(Variant::class, 'variant_id');
    }

    // relation to reference
    public function reference()
    {
        return $this->morphTo();
    }
}
