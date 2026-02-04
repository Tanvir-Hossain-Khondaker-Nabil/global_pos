<?php
// app/Models/Header.php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class Header extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'fav_icon',
        'title',
        'sitebar_name',
        'created_by',
        'outlet_id',
        'owner_id',
        'user_id' // Add this if you have user_id column
    ];

    protected $appends = ['fav_icon_url'];

    protected static function boot()
    {
        parent::boot();

        // Validate only one header per outlet on creation
        static::creating(function ($model) {
            if ($model->outlet_id) {
                $query = self::where('outlet_id', $model->outlet_id);
                
                // Check which column exists
                if (Schema::hasColumn('headers', 'owner_id') && Auth::user()->ownerId()) {
                    $query->where('owner_id', Auth::user()->ownerId());
                } else if (Schema::hasColumn('headers', 'user_id') && Auth::id()) {
                    $query->where('user_id', Auth::id());
                } else if (Schema::hasColumn('headers', 'created_by') && Auth::id()) {
                    $query->where('created_by', Auth::id());
                }
                
                $existingHeader = $query->first();
                
                if ($existingHeader) {
                    throw new \Exception('An outlet can only have one header configuration.');
                }
            }
        });

        // Validate only one header per outlet on update
        static::updating(function ($model) {
            if ($model->outlet_id && $model->isDirty('outlet_id')) {
                $query = self::where('outlet_id', $model->outlet_id)
                    ->where('id', '!=', $model->id);
                
                // Check which column exists
                if (Schema::hasColumn('headers', 'owner_id') && Auth::user()->ownerId()) {
                    $query->where('owner_id', Auth::user()->ownerId());
                } else if (Schema::hasColumn('headers', 'user_id') && Auth::id()) {
                    $query->where('user_id', Auth::id());
                } else if (Schema::hasColumn('headers', 'created_by') && Auth::id()) {
                    $query->where('created_by', Auth::id());
                }
                
                $existingHeader = $query->first();
                
                if ($existingHeader) {
                    throw new \Exception('An outlet can only have one header configuration.');
                }
            }
        });
    }

    // Relationships
    public function outlet()
    {
        return $this->belongsTo(Outlet::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Accessors for file URLs
    public function getFavIconUrlAttribute()
    {
        if (!$this->fav_icon) {
            return null;
        }
        
        if (filter_var($this->fav_icon, FILTER_VALIDATE_URL)) {
            return $this->fav_icon;
        }
        
        if (strpos($this->fav_icon, 'storage/') === 0) {
            return asset($this->fav_icon);
        }
        
        return asset('storage/' . $this->fav_icon);
    }
}