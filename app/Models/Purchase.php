<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Scopes\UserScope;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_no',
        'supplier_id',
        'warehouse_id',
        'purchase_date',
        'grand_total',
        'shadow_total_amount', 
        'shadow_paid_amount',  
        'due_amount',
        'shadow_due_amount',
        'payment_status',
        'paid_amount',
        'notes',
        'status',
        'user_type',
        'created_by',
        'payment_type',
    ];

    // protected $casts = [
    //     'purchase_date' => 'date',
    //     'total_amount' => 'decimal:2',
    //     'shadow_total_amount' => 'decimal:2', 
    //     'shadow_paid_amount' => 'decimal:2',  
    //     'paid_amount' => 'decimal:2',
    //     'due_amount' => 'decimal:2',
    //     'shadow_due_amount' => 'decimal:2',
    // ];

    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
    }



    // all relations 

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class,'created_by');
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
        return $this->hasMany(PurchaseItem::class)->with('product', 'variant');
    }

    //stock
    public function stock()
    {
        return $this->hasMany(Stock::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(Variant::class);
    }


    public function scopeFilter($query, $filters)
    {
        return $query
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('purchase_no', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('company', 'like', "%{$search}%");
                    });
                });
            })

            ->when($filters['status'] ?? null, function ($query, $status) {
                $query->where('status', $status);
            })

            ->when($filters['date'] ?? null, function ($query, $date) {
                $query->whereDate('purchase_date', $date);
            });
    }

}