<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttributeValue extends Model
{
    protected $fillable = ['attribute_id', 'value', 'code', 'is_active'];

    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }
}