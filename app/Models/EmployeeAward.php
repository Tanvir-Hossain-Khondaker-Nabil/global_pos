<?php
// app/Models/EmployeeAward.php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
        'paid_date',
        'created_by',
        'outlet_id',
        'owner_id'
    ];

    protected $casts = [
        'cash_amount' => 'decimal:2',
        'is_paid' => 'boolean',
        'award_date' => 'date',
        'paid_date' => 'date'
    ];

    use BelongsToTenant;

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