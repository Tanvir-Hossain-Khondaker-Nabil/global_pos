<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class ExtraCas extends Model
{
    // fillable
    protected $fillable = ['date', 'amount', 'created_by',
        'outlet_id','owner_id'];

    public function createdby()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    use BelongsToTenant;
}
