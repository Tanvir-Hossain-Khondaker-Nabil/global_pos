<?php
// app/Models/Rank.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'is_active'
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'salary_increment_percentage' => 'decimal:2',
        'is_active' => 'boolean'
    ];

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