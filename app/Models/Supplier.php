<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
   use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'contact_person',
        'email',
        'phone',
        'company',
        'address',
        'website',
        'advance_amount',
        'due_amount',
    ];
}
