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
        'remitted_amount',
        'variance_amount',
        'status',
        'note',
        'recorded_at',
    ];

    protected $casts = [
        'business_date' => 'date',
        'expected_amount' => 'decimal:2',
        'remitted_amount' => 'decimal:2',
        'variance_amount' => 'decimal:2',
        'recorded_at' => 'datetime',
    ];

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_user_id');
    }

    public function accountant()
    {
        return $this->belongsTo(User::class, 'accountant_user_id');
    }
}
