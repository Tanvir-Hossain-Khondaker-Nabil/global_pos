<?php
// app/Models/AllowanceSetting.php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AllowanceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'allowance_type',
        'percentage',
        'fixed_amount',
        'is_percentage',
        'is_active',
        'description',
        'created_by',
        'outlet_id',
        'owner_id'
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'fixed_amount' => 'decimal:2',
        'is_percentage' => 'boolean',
        'is_active' => 'boolean'
    ];

    use BelongsToTenant;

    public function calculateAllowance($basicSalary)
    {
        if ($this->is_percentage) {
            return ($basicSalary * $this->percentage) / 100;
        }
        
        return $this->fixed_amount;
    }
}