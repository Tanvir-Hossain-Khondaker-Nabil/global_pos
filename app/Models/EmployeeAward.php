<?php
// app/Models/EmployeeAward.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeAward extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'award_id',
        'award_date',
        'achievement_reason',
        'cash_amount',
        'is_paid',
        'paid_date'
    ];

    protected $casts = [
        'cash_amount' => 'decimal:2',
        'is_paid' => 'boolean',
        'award_date' => 'date',
        'paid_date' => 'date'
    ];

    public function user()
    {
        return $this->belongsTo(Employee::class);
    }

    public function award()
    {
        return $this->belongsTo(Award::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }


    // app/Models/Award.php
    public function employeeAwards()
    {
        return $this->hasMany(EmployeeAward::class);
    }
}