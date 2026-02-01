<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warranty extends Model
{
    protected $fillable = [
        'sale_item_id',
        'start_date',
        'end_date',
        'terms',
    ];
}
