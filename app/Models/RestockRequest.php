<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestockRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_number',
        'location_id',
        'requested_by_user_id',
        'approved_by_user_id',
        'status',
        'priority',
        'needed_by_date',
        'notes',
        'rejection_reason',
    ];

    protected $casts = [
        'needed_by_date' => 'date',
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

    public function items(): HasMany
    {
        return $this->hasMany(RestockRequestItem::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeUrgent($query)
    {
        return $query->where('priority', 'urgent');
    }

    // Helper methods
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
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
