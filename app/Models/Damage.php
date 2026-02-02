<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Damage extends Model
{
    protected $fillable = [
        'sale_item_id',
        'purchase_item_id',
        'description',
        'damage_date',
        'action_taken',
        'cost',
        'outlet_id',
        'created_by',
        'owner_id',
        'damage_quantity',
        'type',
        'reason'
    ];

    use BelongsToTenant;

    //relationship show here 

    public function saleItem()
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function purchaseItem()
    {
        return $this->belongsTo(PurchaseItem::class);
    }
}
