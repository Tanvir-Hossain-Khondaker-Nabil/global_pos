<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class ExpenseCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'created_by',
        'outlet_id',
        'owner_id'
    ];

    use BelongsToTenant;



    // Relationships, Accessors, Mutators, and other model methods can be added here
    public function expenses()
    {
        return $this->hasMany(Expense::class , 'category_id');
    }
}
