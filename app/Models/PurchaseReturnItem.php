<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_return_id',
        'purchase_item_id',
        'product_id',
        'variant_id',
        'return_quantity',
        'unit_price',
        'shadow_unit_price',
        'sale_price',
        'shadow_sale_price',
        'total_price',
        'shadow_total_price',
        'reason',
        'status' ,
        'outlet_id',
        'owner_id',
        'created_by'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'shadow_unit_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'shadow_sale_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'shadow_total_price' => 'decimal:2',
        'return_quantity' => 'integer',
    ];

    use BelongsToTenant;

    // Add this method to ensure proper status handling
    public function setStatusAttribute($value)
    {
        $allowed = ['pending', 'approved', 'completed', 'cancelled'];
        if (!in_array($value, $allowed)) {
            throw new \InvalidArgumentException("Invalid status value: $value");
        }
        $this->attributes['status'] = $value;
    }

    public function purchaseReturn()
    {
        return $this->belongsTo(PurchaseReturn::class);
    }

    public function purchaseItem()
    {
        return $this->belongsTo(PurchaseItem::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(Variant::class);
    }

    public function stock()
    {
        return $this->hasOne(Stock::class, 'product_id', 'product_id')
            ->where('variant_id', $this->variant_id);
    }
}