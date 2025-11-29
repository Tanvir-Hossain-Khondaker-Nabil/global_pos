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

    protected $casts = [
        'features' => 'array', 
    ];

    // Relation with Subscriptions
    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
