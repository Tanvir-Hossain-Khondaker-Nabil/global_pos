<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class Notification extends Model
{

    protected $fillable = [
        'outlet_id',
        'created_by',
        'owner_id',
        'status',
        'installment_id',
        'sale_id',
        'purchase_id',
        'message',
        'notify_date',
        'title',
        'read_at'
    ];


    use BelongsToTenant;



    //make markAsRead scope
    public function markAsRead($query)
    {
        return $query->update([
            'read_at' => now(),
            'status' => 'read'
        ]);
    }
}
