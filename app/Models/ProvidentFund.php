<?php
// app/Models/ProvidentFund.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProvidentFund extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'month',
        'year',
        'employee_contribution',
        'employer_contribution',
        'total_contribution',
        'current_balance',
        'status',
        'contribution_date'
    ];

    protected $casts = [
        'employee_contribution' => 'decimal:2',
        'employer_contribution' => 'decimal:2',
        'total_contribution' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'contribution_date' => 'date'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function calculateTotalContribution()
    {
        $this->total_contribution = $this->employee_contribution + $this->employer_contribution;
        return $this->total_contribution;
    }

    public function updateBalance()
    {
        $previousBalance = self::where('employee_id', $this->employee_id)
            ->where('id', '<', $this->id)
            ->orderBy('id', 'desc')
            ->value('current_balance') ?? 0;
            
        $this->current_balance = $previousBalance + $this->total_contribution;
        return $this->current_balance;
    }
}