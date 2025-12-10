<?php
// app/Models/BonusSetting.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BonusSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'bonus_name',
        'bonus_type', // 'eid', 'festival', 'performance', 'other'
        'percentage',
        'fixed_amount',
        'is_percentage',
        'is_active',
        'description',
        'effective_date'
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'fixed_amount' => 'decimal:2',
        'is_percentage' => 'boolean',
        'is_active' => 'boolean',
        'effective_date' => 'date'
    ];


    public function isFestivalBonus()
    {
        return in_array($this->bonus_type, ['eid', 'festival']);
    }

    public function isPerformanceBonus()
    {
        return $this->bonus_type === 'performance';
    }

    public function calculateBonus($basicSalary)
    {
        return $this->is_percentage
            ? ($basicSalary * $this->percentage / 100)
            : $this->fixed_amount;
    }

    // Check if bonus applies to specific month
    public function appliesToMonth($month, $year)
    {
        if (!$this->effective_date) {
            return true; // Apply to all months if no effective date
        }

        $effectiveDate = \Carbon\Carbon::parse($this->effective_date);
        return ($effectiveDate->month == $month && $effectiveDate->year == $year);
    }
}