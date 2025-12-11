<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Scopes\UserScope;

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
        'created_by',
    ];



    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
    }


    //relation to sale
    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id')->with('customer');
    }

    //relation to purchase
    public function purchase()
    {
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }

    //relation to product
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id')->with('brand');
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


    //search scope
    public function scopeSearch($query, $term)
    {
        $search = "%$term%";
            $query->where(function ($q) use ($search) {
            $q->whereHas('product', function ($q1) use ($search) {
                $q1->where('name', 'like', $search)
                ->orWhere('product_no', 'like', $search);
            })->orWhereHas('sale', function ($q1) use ($search) {
                $q1->where('invoice_no', 'like', $search)
                ->orWhereHas('customer', function ($q2) use ($search) {
                    $q2->where('customer_name', 'like', $search)
                        ->orWhere('phone', 'like', $search);
                });
            })->orWhereHas('variant', function ($q1) use ($search) {
                $q1->where('sku', 'like', $search);
            })->orWhereHas('warehouse', function ($q1) use ($search) {
                $q1->where('name', 'like', $search);
            });
        });
    }


    public function scopeFilter($query, $filters)
    {
        return $query
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->search($search);
            })

            ->when($filters['customer_id'] ?? null, function ($query, $customerId) {
                $query->whereHas('sale.customer', function ($q) use ($customerId) {
                    $q->where('customer_name', 'like', "%{$customerId}%")
                    ->orWhere('phone', 'like', "%{$customerId}%");
                });
            })

            ->when($filters['product_id'] ?? null, function ($query, $productId) {
                $query->whereHas('product', function ($q) use ($productId) {
                    $q->where('name', 'like', "%{$productId}%")
                    ->orWhere('product_no', 'like', "%{$productId}%");
                });
            })

            ->when($filters['warehouse_id'] ?? null, function ($query, $warehouseId) {
                $query->whereHas('warehouse', function ($q) use ($warehouseId) {
                    $q->where('name', 'like', "%{$warehouseId}%");
                });
            })

            ->when($filters['date_from'] ?? null, function ($query, $dateFrom) {
                $query->whereDate('created_at', '>=', $dateFrom);
            })

            ->when($filters['date_to'] ?? null, function ($query, $dateTo) {
                $query->whereDate('created_at', '<=', $dateTo);
            });
    }


}
