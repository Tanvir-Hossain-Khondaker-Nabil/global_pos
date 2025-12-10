<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Scopes\UserScope;

class Attribute extends Model
{
    protected $fillable = ['name', 'code', 'is_active','created_by'];

    protected $hidden = ['created_by'];
    protected $casts = [
        'created_by' => 'integer',
    ];


    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
    }

    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class);
    }

    public function activeValues(): HasMany
    {
        return $this->values()->where('is_active', true);
    }
}
