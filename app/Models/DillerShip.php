<?php

namespace App\Models;

use Carbon\Carbon;
use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class DillerShip extends Model
{
    
    protected $fillable = [
        'company_id', 'name', 'owner_name', 'email', 'phone', 'address',
        'trade_license_no', 'tin_no', 'nid_no',
        'advance_amount', 'due_amount', 'credit_limit', 'payment_terms',
        'contract_start', 'contract_end', 'contract_file',
        'status', 'approved_by', 'approved_at', 'remarks',
        'total_sales', 'total_orders', 'rating', 'last_order_date',
        'agreement_doc', 'bank_guarantee_doc', 'trade_license_doc', 'nid_doc',
        'tax_clearance_doc',
        'created_by',
        'outlet_id',
        'owner_id'
    ];

    protected $casts = [
        'advance_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'approved_at' => 'datetime',
        'contract_start' => 'date',
        'contract_end' => 'date',
    ];


    use BelongsToTenant;

    
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }


    public function getAverageCuktiMiyadAttribute()
    {
    if ($this->contract_start && $this->contract_end) {
    return Carbon::parse($this->contract_start)->diffInMonths(Carbon::parse($this->contract_end));
    }
    return null;
    }


    public function getRemainingContractDaysAttribute()
    {
    if (! $this->contract_end) return null;
    return Carbon::now()->diffInDays(Carbon::parse($this->contract_end), false); 
    }


    public function scopeSearch($query, $term)
    {
        $term = "%$term%";
        $query->where(function ($query) use ($term) {
            $query->where('name', 'like', $term)
                  ->orWhere('owner_name', 'like', $term)
                  ->orWhere('email', 'like', $term)
                  ->orWhere('phone', 'like', $term);
        });
    }

}
