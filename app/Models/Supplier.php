<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'contact_name',
        'phone',
        'email',
        'address',
        'notes',
        'is_active',
        'archived_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'archived_at' => 'datetime',
    ];

    public function supplierProducts()
    {
        return $this->hasMany(SupplierProduct::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function productVariants()
    {
        return $this->belongsToMany(ProductVariant::class, 'supplier_products')
            ->withPivot('supplier_sku', 'lead_time_days', 'supplier_cost', 'is_primary')
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
