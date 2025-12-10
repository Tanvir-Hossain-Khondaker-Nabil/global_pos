<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Scopes\UserScope;

class ExpenseCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'created_by',
    ];

    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
    }



    // Relationships, Accessors, Mutators, and other model methods can be added here
    public function expenses()
    {
        return $this->hasMany(Expense::class , 'category_id');
    }
}
