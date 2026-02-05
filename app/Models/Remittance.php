<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Remittance extends Model
{
    use HasFactory;

    protected $fillable = [
        'cashier_user_id',
        'accountant_user_id',
        'business_date',
        'expected_amount',
        'expected_cash',
        'expected_noncash_total',
        'expected_by_method',
        'remitted_amount',
        'remitted_cash_amount',
        'variance_amount',
        'cash_variance',
        'status',
        'note',
        'recorded_at',
        'noncash_verified_at',
        'noncash_verified_by_user_id',
        'noncash_verification',
    ];

    protected $casts = [
        'business_date' => 'date',
        'expected_amount' => 'decimal:2',
        'expected_cash' => 'decimal:2',
        'expected_noncash_total' => 'decimal:2',
        'remitted_amount' => 'decimal:2',
        'remitted_cash_amount' => 'decimal:2',
        'variance_amount' => 'decimal:2',
        'cash_variance' => 'decimal:2',
        'recorded_at' => 'datetime',
        'noncash_verified_at' => 'datetime',
        'expected_by_method' => 'array',
        'noncash_verification' => 'array',
    ];

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_user_id');
    }

    public function accountant()
    {
        return $this->belongsTo(User::class, 'accountant_user_id');
    }

    public function noncashVerifier()
    {
        return $this->belongsTo(User::class, 'noncash_verified_by_user_id');
    }
}
