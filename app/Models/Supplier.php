<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function supplierProducts()
    {
        return $this->hasMany(SupplierProduct::class);
    }

    public function productVariants()
    {
        return $this->belongsToMany(ProductVariant::class, 'supplier_products')
            ->withPivot('supplier_sku', 'lead_time_days', 'is_primary')
            ->withTimestamps();
    }

    //public function purchases()
    //{
        //return $this->hasMany(Purchase::class);
    //}

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}