<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToCreator;

class Investment extends Model
{
    use BelongsToCreator;

    protected $fillable = [
        'outlet_id',
        'investor_id',
        'code',
        'start_date',
        'duration_months',
        'end_date',
        'profit_rate',
        'initial_principal',
        'current_principal',
        'status',
        'last_profit_date',
        'note',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'last_profit_date' => 'date',
    ];

    public function investor()
    {
        return $this->belongsTo(Investor::class);
    }

    public function returns()
    {
        return $this->hasMany(InvestmentReturn::class);
    }

    public function withdrawals()
    {
        return $this->hasMany(InvestmentWithdrawal::class);
    }
}
