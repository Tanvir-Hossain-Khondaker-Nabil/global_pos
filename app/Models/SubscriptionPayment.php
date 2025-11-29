<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPayment extends Model
{
    protected $fillable = [
        'subscription_id',
        'payment_method',
        'transaction_id',
        'amount',
        'status',
        'payment_date',
    ];

    // Relation with Subscription
    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }
}
