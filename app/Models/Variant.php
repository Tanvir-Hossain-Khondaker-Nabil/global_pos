<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Variant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'size',
        'color',
        'price',
        'stock'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Get variant name for display
    public function getVariantNameAttribute()
    {
        $parts = [];
        if ($this->size) $parts[] = "Size: {$this->size}";
        if ($this->color) $parts[] = "Color: {$this->color}";
        
        return implode(', ', $parts) ?: 'Default Variant';
    }
}