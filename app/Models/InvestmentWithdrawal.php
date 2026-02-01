<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToCreator;

class InvestmentWithdrawal extends Model
{
    use BelongsToCreator;

    protected $fillable = [
        'investment_id',
        'withdraw_date',
        'amount',
        'reason',
    ];

    protected $casts = [
        'withdraw_date' => 'date',
    ];

    public function investment()
    {
        return $this->belongsTo(Investment::class);
    }
}
