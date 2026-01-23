<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'sku',
        'name',
        'variant',
        'supplier_id',
    ];

    // Relationship to Stock
    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
