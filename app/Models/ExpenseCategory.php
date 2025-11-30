<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
    ];


    // Relationships, Accessors, Mutators, and other model methods can be added here
    public function expenses()
    {
        return $this->hasMany(Expense::class , 'category_id');
    }
}
