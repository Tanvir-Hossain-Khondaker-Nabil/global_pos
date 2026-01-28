<?php
// app/Models/Rank.php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Rank extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'level',
        'base_salary',
        'salary_increment_percentage',
        'min_working_days',
        'max_late_minutes',
        'benefits',
        'is_active',
        'created_by',
        'outlet_id',
        'owner_id'
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'salary_increment_percentage' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    use BelongsToTenant;

    public function users()
    {
        return $this->hasMany(Employee::class);
    }

    public function getNextRank()
    {
        return self::where('level', '>', $this->level)
            ->where('is_active', true)
            ->orderBy('level')
            ->first();
    }
}