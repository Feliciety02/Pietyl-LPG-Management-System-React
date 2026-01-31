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
        'ordered_at',
        'received_at',
        'subtotal',
        'grand_total',
    ];

    protected $casts = [
        'ordered_at' => 'datetime',
        'received_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'grand_total' => 'decimal:2',
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

    /**
     * Get the stock movements for this purchase.
     */
    //public function stockMovements()
    //{
        //return $this->morphMany(StockMovement::class, 'reference');
    //}

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