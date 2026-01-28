<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attribute extends Model
{
    protected $fillable = ['name', 'code', 'is_active', 'created_by', 'outlet_id','owner_id'];

    protected $hidden = ['created_by'];
    
    protected $casts = [
        'created_by' => 'integer',
        'is_active' => 'boolean',
        'outlet_id' => 'integer',
    ];

    use BelongsToTenant;

    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class);
    }

    public function activeValues(): HasMany
    {
        return $this->values()->where('is_active', true);
    }

    // Relationship with outlet
    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    // Relationship with creator
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scope for active attributes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Scope for current outlet only
    public function scopeCurrentOutlet($query)
    {
        if (Auth::check() && Auth::user()->current_outlet_id) {
            return $query->where('outlet_id', Auth::user()->current_outlet_id);
        }
        return $query;
    }

    // Scope for specific outlet
    public function scopeForOutlet($query, $outletId)
    {
        return $query->where('outlet_id', $outletId);
    }

    // Get only attributes for user's current outlet
    public static function forCurrentOutlet()
    {
        return self::currentOutlet()->get();
    }
}