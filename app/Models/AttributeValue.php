<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Contracts\Database\Query\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttributeValue extends Model
{
    protected $fillable = ['attribute_id', 'value', 'code', 'is_active', 'outlet_id', 'created_by', 'owner_id'];

    use BelongsToTenant;

    
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }


}