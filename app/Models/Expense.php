<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    // fillable
    protected $fillable = ['date', 'details', 'amount', 'created_by'];

    public function createdby()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
