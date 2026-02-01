<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class Sale extends Model
{
  protected $fillable = [
        'customer_id',
        'supplier_id',
        'invoice_no',
        'sub_total',
        'discount',
        'vat_tax',
        'grand_total',
        'paid_amount',
        'due_amount',
        'shadow_vat_tax',
        'shadow_discount',
        'shadow_sub_total',
        'shadow_grand_total',
        'shadow_paid_amount',
        'shadow_due_amount',
        'shadow_type',
        'payment_type',
        'account_id',
        'status',
        'type',
        'sale_type',
        'created_by',
        'outlet_id',
        'discount_type',
        'owner_id',
        'installment_duration',
        'total_installments'
    ];


    use BelongsToTenant;

    //account relation
    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    

    //relation to customer
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    // relation to sale items
    public function items()
    {
            return $this->hasMany(SaleItem::class, 'sale_id')
                ->with('product', 'variant', 'product.brand', 'warehouse', 'stock');
    }


    //payments relation
    public function payments()
    {
        return $this->hasMany(Payment::class, 'sale_id');
    }

    //user relation
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by')->with('business');
    }

    //returns relation
    public function returns()
    {
        return $this->hasMany(SalesReturn::class, 'sale_id');
    }


    //warehouse relation
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
