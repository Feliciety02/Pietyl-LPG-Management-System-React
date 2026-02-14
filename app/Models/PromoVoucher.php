<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PromoVoucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'kind',
        'discount_type',
        'value',
        'usage_limit',
        'times_redeemed',
        'starts_at',
        'expires_at',
        'is_active',
        'discontinued_at',
        'discontinued_by_user_id',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'usage_limit' => 'integer',
        'times_redeemed' => 'integer',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'discontinued_at' => 'datetime',
    ];

    public function discontinuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'discontinued_by_user_id');
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(PromoRedemption::class);
    }

    public function isActiveForDate(?Carbon $date = null): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $date = $date ?: Carbon::now();

        if ($this->starts_at && $date->lt($this->starts_at)) {
            return false;
        }

        if ($this->expires_at && $date->gt($this->expires_at)) {
            return false;
        }

        return true;
    }
}
