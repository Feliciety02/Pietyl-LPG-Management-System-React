<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryBalance extends Model
{
    protected $fillable = [
        'location_id',
        'product_variant_id',
        'qty_filled',
        'qty_empty',
        'qty_reserved',
        'reorder_level',
    ];


    protected $casts = [
        'qty_on_hand' => 'integer',
        'qty_reserved' => 'integer',
        'reorder_level' => 'integer',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function getQtyOnHandAttribute()
    {
        return $this->qty_filled + $this->qty_empty;
    }
}