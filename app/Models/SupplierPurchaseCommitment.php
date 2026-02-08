<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Models\PurchaseRequest;
use App\Models\User;

class SupplierPurchaseCommitment extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_POSTED = 'posted';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'purchase_request_id',
        'expense_type',
        'reference',
        'amount_estimated',
        'amount_final',
        'currency',
        'status',
        'created_by_user_id',
        'posted_by_user_id',
        'posted_at',
        'notes',
    ];

    protected $casts = [
        'amount_estimated' => 'decimal:2',
        'amount_final' => 'decimal:2',
        'posted_at' => 'datetime',
    ];

    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by_user_id');
    }

    public function markPosted(float $finalAmount, User $postedBy): self
    {
        $this->status = self::STATUS_POSTED;
        $this->amount_final = $finalAmount;
        $this->posted_by_user_id = $postedBy->id;
        $this->posted_at = now();
        $this->save();

        return $this;
    }
}
