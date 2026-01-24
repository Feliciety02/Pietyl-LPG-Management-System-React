<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierProduct extends Model
{
    protected $fillable = [
        'supplier_id',
        'product_variant_id',
        'supplier_sku',
        'lead_time_days',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'lead_time_days' => 'integer',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }
}