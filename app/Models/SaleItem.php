<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'variant_id',
        'warehouse_id',
        'quantity',
        'unit_price',
        'total_price',
        'shadow_unit_price',
        'shadow_total_price',
        'status',
    ];



    //relation to sale
    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id')->with('customer');
    }

    //relation to product
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    //relation to variant
    public function variant()
    {
        return $this->belongsTo(Variant::class, 'variant_id');
    }

    //relation to warehouse
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }
}
