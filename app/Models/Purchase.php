<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_no',
        'supplier_id',
        'warehouse_id',
        'purchase_date',
        'total_amount',
        'shadow_total_amount', // Add this
        'shadow_paid_amount',  // Add this
        'paid_amount',
        'notes',
        'status'
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'total_amount' => 'decimal:2',
        'shadow_total_amount' => 'decimal:2', // Add this
        'shadow_paid_amount' => 'decimal:2',  // Add this
        'paid_amount' => 'decimal:2'
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }


    public function getDueAmountAttribute()
    {
        return $this->total_amount - $this->paid_amount;
    }

    public function getStatusColorAttribute()
    {
        return match ($this->status) {
            'completed' => 'success',
            'pending' => 'warning',
            'cancelled' => 'error',
            default => 'neutral'
        };
    }

    // Purchase model
    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(Variant::class);
    }
}