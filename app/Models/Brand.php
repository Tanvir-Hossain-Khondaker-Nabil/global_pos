<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class Brand extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'logo',
        'description',
        'outlet_id',
        'created_by',
        'owner_id'
    ];

    use BelongsToTenant;

    protected $appends = ['logo_url'];


    public function products()
    {
        return $this->hasMany(Product::class);
    }

       // Add search scope
    public function scopeSearch($query, $search)
    {
        return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
    }

    // Accessor for logo URL

    public function getLogoUrlAttribute()
    {
        if ($this->logo) {
            // If using public disk
            return asset('storage/' . $this->logo);
            
            // If using a different disk
            // return Storage::disk('public')->url($this->logo);
        }
        
        return null;
    }

}
