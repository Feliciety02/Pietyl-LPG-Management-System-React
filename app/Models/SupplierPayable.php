<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\PayableLedger;
use App\Models\Purchase;

class SupplierPayable extends Model
{
    public const STATUS_UNPAID = 'unpaid';
    public const STATUS_PAID = 'paid';

    protected $fillable = [
        'supplier_id',
        'source_type',
        'source_id',
        'amount',
        'gross_amount',
        'deductions_total',
        'net_amount',
        'purchase_id',
        'status',
        'created_by_user_id',
        'paid_by_user_id',
        'payment_method',
        'bank_ref',
        'ledger_entry_id',
        'paid_at',
        'paid_amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'gross_amount' => 'decimal:2',
        'deductions_total' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function ledgerEntry(): BelongsTo
    {
        return $this->belongsTo(LedgerEntry::class);
    }

    public function source()
    {
        return $this->morphTo(__FUNCTION__, 'source_type', 'source_id');
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function ledgers()
    {
        return $this->hasMany(PayableLedger::class)->latest('created_at');
    }

    protected function resolveFallbackPayableColumns(): array
    {
        return ['amount', 'grand_total'];
    }

    public function getNetAmountAttribute($value)
    {
        if (!is_null($value)) {
            return (float) $value;
        }

        foreach ($this->resolveFallbackPayableColumns() as $column) {
            if (array_key_exists($column, $this->attributes) && !is_null($this->attributes[$column])) {
                return (float) $this->attributes[$column];
            }
        }

        return 0.0;
    }

    public function getIsPaidAttribute(): bool
    {
        return $this->status === self::STATUS_PAID;
    }
}
