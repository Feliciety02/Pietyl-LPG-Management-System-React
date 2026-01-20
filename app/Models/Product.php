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
    ];

    // Relationship to Stock
    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }
}
