<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToCreator;

class InvestmentReturn extends Model
{
    use BelongsToCreator;

    protected $fillable = [
    'created_by',
    'investment_id',
    'period_end',
    'principal_snapshot',
    'profit_amount',
    'status',
    'paid_date',
];


    protected $casts = [
        'period_end' => 'date',
        'paid_date' => 'date',
    ];

    public function investment()
    {
        return $this->belongsTo(Investment::class);
    }
}
