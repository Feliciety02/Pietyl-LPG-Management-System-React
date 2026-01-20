<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'filled_qty',
        'empty_qty',
        'total_qty',
        'last_counted_at',
        'updated_by',
        'reason',
    ];

    protected $casts = [
        'last_counted_at' => 'datetime',
    ];

    // Relationship to Product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
