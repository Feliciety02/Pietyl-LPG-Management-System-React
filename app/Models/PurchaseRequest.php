<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

use App\Models\User;
use App\Models\Supplier;
use App\Models\PurchaseRequestItem;
use App\Models\PurchaseReceipt;
use App\Models\SupplierPurchaseCommitment;

class PurchaseRequest extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_APPROVED_PENDING_SUPPLIER = 'approved_pending_supplier';
    public const STATUS_SUPPLIER_CONTACTED_WAITING_DELIVERY = 'supplier_contacted_waiting_delivery';
    public const STATUS_PARTIALLY_RECEIVED = 'partially_received';
    public const STATUS_FULLY_RECEIVED = 'fully_received';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'pr_number',
        'requested_by_user_id',
        'status',
        'reason',
        'notes',
        'requested_at',
        'admin_action_at',
        'admin_user_id',
        'rejection_reason',
        'supplier_id',
        'expected_delivery_date',
        'supplier_contacted_at',
        'total_estimated_cost',
        'currency',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'admin_action_at' => 'datetime',
        'supplier_contacted_at' => 'datetime',
        'expected_delivery_date' => 'date',
        'total_estimated_cost' => 'decimal:2',
    ];

    protected $attributes = [
        'currency' => 'PHP',
        'status' => self::STATUS_DRAFT,
    ];

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(PurchaseReceipt::class);
    }

    public function commitment(): HasOne
    {
        return $this->hasOne(SupplierPurchaseCommitment::class);
    }

    public function scopeSubmitted(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_SUBMITTED);
    }

    public function scopePendingSupplier(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_APPROVED_PENDING_SUPPLIER);
    }

    public function getEstimatedTotalAttribute(): float
    {
        return (float) $this->items()
            ->get()
            ->sum(fn (PurchaseRequestItem $item) => ($item->approved_qty ?? 0) * ($item->unit_cost_estimated ?? 0));
    }

    public function getFinalTotalAttribute(): float
    {
        return (float) $this->items()
            ->get()
            ->sum(fn (PurchaseRequestItem $item) => ($item->received_qty ?? 0) * ($item->unit_cost_final ?? 0));
    }

    public function isAwaitingDelivery(): bool
    {
        return $this->status === self::STATUS_SUPPLIER_CONTACTED_WAITING_DELIVERY;
    }
}
