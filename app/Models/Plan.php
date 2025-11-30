<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'price',
        'plan_type',
        'validity',
        'description',
        'features',
        'status',
        'total_sell',
    ];


    const PLAN_FREE = 1;
    const PLAN_PAID = 2;

    protected $casts = [
        'features' => 'array', 
    ];

    const STATUS_ACTIVE = 1;
    const STATUS_INACTIVE = 2;

    // Relation with Subscriptions
    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }


    // Scope for active plans
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }


    // Scope for plan type
    public function scopeOfType($query, $type)
    {
        return $query->where('plan_type', $type);
    }


    // Scope for searching plans
    public function scopeSearch($query, $term)
    {
        return $query->where('name', 'like', "%{$term}%")
                     ->orWhere('description', 'like', "%{$term}%")
                     ->orWhereJsonContains('features', $term);
    }
                     
}
