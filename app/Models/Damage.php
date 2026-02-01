<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Damage extends Model
{
    protected $fillable = [
        'sale_item_id',
        'description',
        'damage_date',
        'action_taken',
        'cost',
    ];
}
