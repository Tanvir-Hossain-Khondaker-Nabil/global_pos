<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expiry extends Model
{
    protected $fillable = [
        'sale_item_id',
        'expire_date',
        'status',
    ];
}
