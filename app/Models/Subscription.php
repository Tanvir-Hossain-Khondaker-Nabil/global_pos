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

}
