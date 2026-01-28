<?php
// app/Models/Award.php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
        'is_active',
        'created_by',
        'outlet_id',
        'owner_id'
    ];

    protected $casts = [
        'cash_reward' => 'decimal:2',
        'criteria' => 'array',
        'is_active' => 'boolean'
    ];

     use BelongsToTenant;

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