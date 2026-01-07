<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Scopes\UserScope;
use App\Models\DillerShip;


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
        'dealership_id',
        // 'send_welcome_sms'
    ];

    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
    }


    //relationship to dealership
    public function dealership()
    {
        return $this->belongsTo(DillerShip::class, 'dealership_id' , 'id');
    }

    //relationship to creator
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    //relationship to purchases
    public function purchases()
    {
        return $this->hasMany(Purchase::class, 'supplier_id')->with('warehouse', 'creator','items');
    }

    //active scrope 
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }


    }