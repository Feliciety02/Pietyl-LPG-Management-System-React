<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'product_variant_id',
        'qty',
        'received_qty',
        'unit_cost',
        'line_total',
    ];

    protected $casts = [
        'qty' => 'decimal:3',
        'received_qty' => 'decimal:3',
        'unit_cost' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    /**
     * Get the purchase that owns the item.
     */
    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    /**
     * Get the product variant.
     */
    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Calculate line_total before saving
        static::saving(function ($item) {
            $item->line_total = $item->qty * $item->unit_cost;
        });
    }
}