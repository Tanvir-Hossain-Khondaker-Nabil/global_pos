<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class BusinessProfile extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'website',
        'user_id',
        'description',
        'tax_number',
        'thum',
        'logo',
        'created_by',
        'outlet_id',
        'owner_id'
    ];

     use BelongsToTenant;

    // Reverse relationship: Business belongs to one user
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
