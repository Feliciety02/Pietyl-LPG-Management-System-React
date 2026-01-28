<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id',
        'product_variant_id',
        'movement_type',
        'qty',
        'reference_type',
        'reference_id',
        'performed_by_user_id',
        'moved_at',
        'notes',
    ];

    protected $casts = [
        'qty' => 'decimal:3',
        'moved_at' => 'datetime',
    ];

    /**
     * Get the location.
     */
    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Get the product variant.
     */
    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the user who performed the movement.
     */
    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by_user_id');
    }

    /**
     * Get the owning reference model (polymorphic).
     */
    public function reference()
    {
        return $this->morphTo();
    }

    /**
     * Scope a query to only include movements of a given type.
     */
    public function scopeMovementType($query, $type)
    {
        return $query->where('movement_type', $type);
    }

    /**
     * Scope a query to only include movements for a location.
     */
    public function scopeForLocation($query, $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    /**
     * Scope a query to only include movements for a product variant.
     */
    public function scopeForVariant($query, $variantId)
    {
        return $query->where('product_variant_id', $variantId);
    }

    /**
     * Common movement types
     */
    const TYPE_PURCHASE_IN = 'purchase_in';
    const TYPE_SALE_OUT = 'sale_out';
    const TYPE_ADJUSTMENT = 'adjustment';
    const TYPE_DAMAGE = 'damage';
    const TYPE_TRANSFER_IN = 'transfer_in';
    const TYPE_TRANSFER_OUT = 'transfer_out';
}