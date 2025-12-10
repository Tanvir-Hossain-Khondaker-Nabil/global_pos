<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Scopes\UserScope;

class Expense extends Model
{
    // fillable
        protected $fillable = [
        'date', 
        'details', 
        'amount', 
        'created_by',
        'sh_amount', 
        'category_id'
    ];


    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
    }


    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'category_id');
    }
}
