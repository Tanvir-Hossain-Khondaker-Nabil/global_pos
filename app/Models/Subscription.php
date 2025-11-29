<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'validity',
        'start_date',
        'end_date',
        'status',
    ];


    //relations with plan
    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }


    //relations with company user
    public function user()
    {
        return $this->belongsTo(User::class);
    }


    // Relation with SubscriptionPayment
    public function payments()
    {
        return $this->hasMany(SubscriptionPayment::class);
    }

    // Scope for searching subscriptions
    public function scopeSearch($query, $term)
    {
        return $query->whereHas('user', function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('email', 'like', "%{$term}%");
        })->orWhereHas('plan', function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%");
        });
    }


    //status scope
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

}
