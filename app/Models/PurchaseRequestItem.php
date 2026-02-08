<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Models\PurchaseRequest;
use App\Models\Product;
use App\Models\PurchaseReceiptItem;

class PurchaseRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_request_id',
        'product_id',
        'requested_qty',
        'approved_qty',
        'unit_cost_estimated',
        'unit_cost_final',
        'received_qty',
        'damaged_qty',
        'remarks',
    ];

    protected $casts = [
        'unit_cost_estimated' => 'decimal:2',
        'unit_cost_final' => 'decimal:2',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class, 'purchase_request_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function receiptItems(): HasMany
    {
        return $this->hasMany(PurchaseReceiptItem::class);
    }

    public function getPendingReceiptQtyAttribute(): int
    {
        return max(0, (int) ($this->approved_qty ?? 0) - (int) ($this->received_qty ?? 0));
    }
}
