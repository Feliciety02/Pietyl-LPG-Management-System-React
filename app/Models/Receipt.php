<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'receipt_number',
        'printed_count',
        'issued_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'printed_count' => 'integer',
    ];

    /**
     * Get the sale that owns the receipt.
     */
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Increment the printed count.
     */
    public function incrementPrintCount()
    {
        $this->increment('printed_count');
        return $this;
    }

    /**
     * Generate a unique receipt number.
     */
    public static function generateReceiptNumber()
    {
        $prefix = 'R-';
        $lastReceipt = self::latest('id')->first();
        $number = $lastReceipt ? intval(substr($lastReceipt->receipt_number, strlen($prefix))) + 1 : 1;
        
        return $prefix . str_pad($number, 6, '0', STR_PAD_LEFT);
    }
}