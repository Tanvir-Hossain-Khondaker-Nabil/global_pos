<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class Notification extends Model
{

    protected $fillable = [
        'outlet_id',
        'created_by',
        'owner_id'
    ];


    use BelongsToTenant;
}
