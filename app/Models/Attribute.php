<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Attribute extends Model
{
    protected $fillable = ['name', 'code', 'is_active'];

    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class);
    }

    public function activeValues(): HasMany
    {
        return $this->values()->where('is_active', true);
    }
}
