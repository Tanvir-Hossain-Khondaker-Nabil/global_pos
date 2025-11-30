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

    
    const STATUS_PENDING = 1;
    const STATUS_COMPLETED = 2;
    const STATUS_FAILED = 3;

    // Relation with Subscription
    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }
}
