<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_number',
        'sale_type',
        'customer_id',
        'cashier_user_id',
        'status',
        'sale_datetime',
        'subtotal',
        'discount_total',
        'tax_total',
        'grand_total',
        'vat_treatment',
        'vat_rate',
        'vat_inclusive',
        'vat_amount',
        'net_amount',
        'gross_amount',
        'vat_applied',
        'notes',
    ];

    protected $casts = [
        'sale_datetime' => 'datetime',
        'subtotal' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'vat_rate' => 'decimal:4',
        'vat_inclusive' => 'boolean',
        'vat_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'gross_amount' => 'decimal:2',
        'vat_applied' => 'boolean',
    ];

    // Relationships
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    
    public function receipt(): HasOne
    {
        return $this->hasOne(Receipt::class);
    }

    // Scopes
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('sale_datetime', today());
    }

    public function scopeWalkin($query)
    {
        return $query->where('sale_type', 'walkin');
    }

    public function scopeDelivery($query)
    {
        return $query->where('sale_type', 'delivery');
    }

    // Helper methods
    public function isWalkin(): bool
    {
        return $this->sale_type === 'walkin';
    }

    public function isDelivery(): bool
    {
        return $this->sale_type === 'delivery';
    }

    public function getTotalPaid(): float
    {
        return $this->payments->sum('amount');
    }

    public static function generateSaleNumber(): string
    {
        $date = now()->format('Ymd');
        $lastSale = static::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastSale ? ((int) substr($lastSale->sale_number, -4)) + 1 : 1;
        
        return 'SALE-' . $date . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
