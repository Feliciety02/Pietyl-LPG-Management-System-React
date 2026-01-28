<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestockRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'restock_request_id',
        'product_variant_id',
        'current_qty',
        'reorder_level',
        'requested_qty',
        'supplier_id',
        'linked_purchase_id',
    ];

    protected $casts = [
        'current_qty' => 'decimal:3',
        'reorder_level' => 'decimal:3',
        'requested_qty' => 'decimal:3',
    ];

    // Relationships
    public function restockRequest(): BelongsTo
    {
        return $this->belongsTo(RestockRequest::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function linkedPurchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class, 'linked_purchase_id');
    }

    // Helper methods
    public function hasLinkedPurchase(): bool
    {
        return !is_null($this->linked_purchase_id);
    }

    public function getShortageQty(): float
    {
        return max(0, $this->reorder_level - $this->current_qty);
    }
}