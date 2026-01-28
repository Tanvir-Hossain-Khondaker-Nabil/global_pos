<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class Company extends Model
{
    protected $fillable = [
        'name',
        'address',
        'email',
        'phone',
        'website',
        'logo',
        'status',
        'created_by',
        'outlet_id',
        'owner_id'
    ];

    use BelongsToTenant;
}
