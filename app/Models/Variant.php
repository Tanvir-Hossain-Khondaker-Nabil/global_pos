<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Variant extends Model
{
    // একটি size row এর সাথে তার colors
    public function colors()
    {
        return $this->hasMany(Variant::class, 'parent_id', 'id');
    }

    // যদি এটি color row হয়, তার parent size
    public function size()
    {
        return $this->belongsTo(Variant::class, 'parent_id', 'id');
    }

    // Product relation
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
