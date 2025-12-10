<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Scopes\UserScope;

class Category extends Model
{

    protected $fillable = [
        'name',
        'created_by',
    ];

    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
    }

    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }
    }

    public function products(){
        return $this->hasMany(Product::class, 'category_id');
    }
}
