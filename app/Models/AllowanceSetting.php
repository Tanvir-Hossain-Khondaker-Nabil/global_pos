<?php
// app/Models/AllowanceSetting.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AllowanceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'allowance_type',
        'percentage',
        'fixed_amount',
        'is_percentage',
        'is_active',
        'description'
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'fixed_amount' => 'decimal:2',
        'is_percentage' => 'boolean',
        'is_active' => 'boolean'
    ];

    public function calculateAllowance($basicSalary)
    {
        if ($this->is_percentage) {
            return ($basicSalary * $this->percentage) / 100;
        }
        
        return $this->fixed_amount;
    }
}