<?php
// app/Models/Award.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Award extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'cash_reward',
        'type',
        'month',
        'year',
        'criteria',
        'is_active'
    ];

    protected $casts = [
        'cash_reward' => 'decimal:2',
        'criteria' => 'array',
        'is_active' => 'boolean'
    ];

    public function employeeAwards()
    {
        return $this->hasMany(EmployeeAward::class);
    }

    public function recipients()
    {
        return $this->belongsToMany(Employee::class, 'employee_awards')
                    ->withPivot('award_date', 'achievement_reason', 'cash_amount', 'is_paid', 'paid_date')
                    ->withTimestamps();
    }
}