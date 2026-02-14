<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromoRedemption extends Model
{
    use HasFactory;

    protected $fillable = [
        'promo_voucher_id',
        'sale_id',
        'cashier_user_id',
        'discount_amount',
        'redeemed_at',
    ];

    protected $casts = [
        'discount_amount' => 'decimal:2',
        'redeemed_at' => 'datetime',
    ];

    public function promoVoucher(): BelongsTo
    {
        return $this->belongsTo(PromoVoucher::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_user_id');
    }
}
