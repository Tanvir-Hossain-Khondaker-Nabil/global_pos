<?php

namespace App\Models;

use App\Models\Investment;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToCreator;

class Investor extends Model
{
    use BelongsToCreator;

    protected $fillable = [
        'name', 'phone', 'email', 'address', 'is_active','created_by',
    ];

    public function investments()
    {
        return $this->hasMany(Investment::class);
    }
}
