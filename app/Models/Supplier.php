<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Scopes\UserScope;


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
        'is_active',
        'created_by',
    ];

    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
    }


    //relationship to purchases
    public function purchases()
    {
        return $this->hasMany(Purchase::class, 'supplier_id');
    }

    //active scrope 
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }


    }