<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Models\Remittance;
use App\Models\User;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'payment_method_id',
        'amount',
        'reference_no',
        'received_by_user_id',
        'paid_at',
        'noncash_verified_at',
        'noncash_verified_by_user_id',
        'noncash_verified_business_date',
        'noncash_remittance_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'noncash_verified_at' => 'datetime',
        'noncash_verified_business_date' => 'date',
    ];

    // Relationships
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by_user_id');
    }

    public function noncashVerifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'noncash_verified_by_user_id');
    }

    public function remittance(): BelongsTo
    {
        return $this->belongsTo(Remittance::class, 'noncash_remittance_id');
    }

    // Helper methods
    public function isCash(): bool
    {
        return $this->paymentMethod?->method_key === 'cash';
    }

    public function hasReference(): bool
    {
        return !empty($this->reference_no);
    }
}
