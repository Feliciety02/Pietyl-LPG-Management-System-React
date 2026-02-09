<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_number',
        'supplier_id',
        'created_by_user_id',
        'status',
        'rejection_reason',
        'ordered_at',
        'received_at',
        'supplier_reference_no',
        'delivery_reference_no',
        'delivered_qty',
        'damaged_qty',
        'missing_qty',
        'damage_category',
        'damage_reason',
        'subtotal',
        'grand_total',
        'supplier_payable_id',
    ];

    protected $casts = [
        'ordered_at' => 'datetime',
        'received_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'delivered_qty' => 'decimal:3',
        'damaged_qty' => 'decimal:3',
        'missing_qty' => 'decimal:3',
    ];

    /**
     * Get the supplier that owns the purchase.
     */
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the user who created the purchase.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Get the items for the purchase.
     */
    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function payable()
    {
        return $this->belongsTo(\App\Models\SupplierPayable::class, 'supplier_payable_id');
    }

    public function supplierPayable()
    {
        return $this->hasOne(\App\Models\SupplierPayable::class, 'purchase_id');
    }

    /**
     * Get the stock movements for this purchase.
     */
    //public function stockMovements()
    //{
        //return $this->morphMany(StockMovement::class, 'reference');
    //}

    public function getPrimaryItemUnitCost(): float
    {
        $item = $this->items->first();
        return (float) ($item?->unit_cost ?? 0);
    }

    public function getOrderedQuantity(): float
    {
        return (float) $this->items->sum('qty');
    }

    public function getSubtotalAmount(float $unitCost = null): float
    {
        $cost = $unitCost ?? $this->getPrimaryItemUnitCost();
        return round($this->getOrderedQuantity() * $cost, 2);
    }

    public function getDamageDeductionAmount(float $unitCost = null): float
    {
        $cost = $unitCost ?? $this->getPrimaryItemUnitCost();
        return round(max(0, (float) $this->damaged_qty) * $cost, 2);
    }

    public function getNetPayableAmount(float $unitCost = null): float
    {
        $subtotal = $this->getSubtotalAmount($unitCost);
        $deduction = $this->getDamageDeductionAmount($unitCost);
        return round(max(0, $subtotal - $deduction), 2);
    }

    /**
     * Scope a query to only include purchases with a given status.
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to search purchases.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('purchase_number', 'like', "%{$search}%")
              ->orWhereHas('supplier', function ($q) use ($search) {
                  $q->where('name', 'like', "%{$search}%");
              });
        });
    }
}
