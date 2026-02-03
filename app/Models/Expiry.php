<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class Expiry extends Model
{
    protected $fillable = [
        'sale_item_id',
        'purchase_item_id',
        'expire_date',
        'status',
        'outlet_id',
        'created_by',
        'owner_id'
    ];

    use BelongsToTenant;
}
