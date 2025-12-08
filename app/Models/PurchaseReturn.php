<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'return_no',
        'purchase_id',
        'supplier_id',
        'warehouse_id',
        'return_date',
        'return_type',
        'total_return_amount',
        'refunded_amount',
        'shadow_return_amount',
        'shadow_refunded_amount',
        'reason',
        'notes',
        'status',
        'created_by',
        'user_type',
        'payment_type'
    ];

    protected $casts = [
        'return_date' => 'date',
        'total_return_amount' => 'decimal:2',
        'refunded_amount' => 'decimal:2',
        'shadow_return_amount' => 'decimal:2',
        'shadow_refunded_amount' => 'decimal:2',
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseReturnItem::class);
    }

    public function replacementProducts()
    {
        return $this->hasMany(ReplacementProduct::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function isMoneyBack()
    {
        return $this->return_type === 'money_back';
    }

    public function isProductReplacement()
    {
        return $this->return_type === 'product_replacement';
    }

    public function canBeApproved()
    {
        return $this->status === 'pending';
    }

    public function canBeCompleted()
    {
        return $this->status === 'approved';
    }
}