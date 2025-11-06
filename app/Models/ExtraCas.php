<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExtraCas extends Model
{
    // fillable
    protected $fillable = ['date', 'amount', 'created_by'];

    public function createdby()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
