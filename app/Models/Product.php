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

    public function suppliers()
    {
        return $this->belongsToMany(Supplier::class, 'product_supplier')
            ->withTimestamps()
            ->withPivot('is_default');
    }

    public function defaultSupplier()
    {
        return $this->belongsToMany(Supplier::class, 'product_supplier')
            ->wherePivot('is_default', true)
            ->withTimestamps();
    }
}
