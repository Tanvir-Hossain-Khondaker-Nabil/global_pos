<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessProfile extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'website',
        'user_id',
        'description',
        'tax_number',
        'thum',
        'logo'
    ];


    //user relationship
    public function  user()
    {
        $this->belongsTo(User::class);
    }
}
