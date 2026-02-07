<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestockRequest extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_RECEIVING = 'receiving';
    public const STATUS_RECEIVED = 'received';
    public const STATUS_PAYABLE_OPEN = 'payable_open';
    public const STATUS_PAID = 'paid';
    public const STATUS_CLOSED = 'closed';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'request_number',
        'location_id',
        'requested_by_user_id',
        'submitted_by_user_id',
        'approved_by_user_id',
        'received_by_user_id',
        'supplier_id',
        'supplier_payable_id',
        'status',
        'priority',
        'needed_by_date',
        'notes',
        'rejection_reason',
        'supplier_invoice_ref',
        'supplier_invoice_date',
        'subtotal_cost',
        'total_cost',
        'received_at',
        'receiving_started_at',
    ];

    protected $casts = [
        'needed_by_date' => 'date',
        'supplier_invoice_date' => 'date',
        'received_at' => 'datetime',
        'receiving_started_at' => 'datetime',
        'subtotal_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    // Relationships
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by_user_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function payable(): BelongsTo
    {
        return $this->belongsTo(SupplierPayable::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RestockRequestItem::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->whereIn('status', [
            'pending',
            self::STATUS_DRAFT,
            self::STATUS_SUBMITTED,
        ]);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    public function scopePurchasingStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeUrgent($query)
    {
        return $query->where('priority', 'urgent');
    }

    // Helper methods
    public function isPending(): bool
    {
        return in_array(
            $this->status,
            ['pending', self::STATUS_DRAFT, self::STATUS_SUBMITTED],
            true
        );
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isReceived(): bool
    {
        return $this->status === self::STATUS_RECEIVED;
    }

    public function isPayableOpen(): bool
    {
        return $this->status === self::STATUS_PAYABLE_OPEN;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isSubmitted(): bool
    {
        return $this->status === self::STATUS_SUBMITTED;
    }

    public function isReceiving(): bool
    {
        return $this->status === self::STATUS_RECEIVING;
    }

    public function isClosed(): bool
    {
        return $this->status === self::STATUS_CLOSED;
    }

    public function isRejectedOrClosed(): bool
    {
        return $this->status === self::STATUS_REJECTED || $this->status === self::STATUS_CLOSED;
    }

    public function isFullyReceived(): bool
    {
        return $this->items->every(fn ($item) => (float) $item->received_qty >= (float) $item->approved_qty);
    }

    public static function generateRequestNumber(): string
    {
        $date = now()->format('Ymd');

        $last = static::whereDate('created_at', today())
            ->select('request_number')
            ->orderByDesc('id')
            ->lockForUpdate()
            ->first();

        $seq = $last
            ? ((int) substr($last->request_number, -4)) + 1
            : 1;

        return 'RR-' . $date . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}
