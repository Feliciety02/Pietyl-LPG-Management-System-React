<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'product_variant_id',
        'qty',
        'unit_price',
        'line_total',
        'pricing_source',
        'line_net_amount',
        'line_vat_amount',
        'line_gross_amount',
    ];

    protected $casts = [
        'qty' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'line_net_amount' => 'decimal:2',
        'line_vat_amount' => 'decimal:2',
        'line_gross_amount' => 'decimal:2',
    ];

    // Relationships
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    // Helper methods
    public function calculateLineTotal(): float
    {
        return $this->qty * $this->unit_price;
    }

    // Automatically calculate line_total before saving
    protected static function booted()
    {
        static::saving(function ($item) {
            $item->line_total = $item->qty * $item->unit_price;
        });
    }
}
