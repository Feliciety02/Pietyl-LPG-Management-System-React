<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountingReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_type',
        'date_from',
        'date_to',
        'total_sales',
        'total_net_sales',
        'total_vat',
        'total_cash',
        'total_non_cash',
        'total_remitted',
        'variance_total',
        'generated_at',
        'generated_by_user_id',
    ];

    protected $casts = [
        'date_from' => 'date',
        'date_to' => 'date',
        'generated_at' => 'datetime',
        'total_sales' => 'decimal:2',
        'total_net_sales' => 'decimal:2',
        'total_vat' => 'decimal:2',
        'total_cash' => 'decimal:2',
        'total_non_cash' => 'decimal:2',
        'total_remitted' => 'decimal:2',
        'variance_total' => 'decimal:2',
    ];

    public function generatedBy()
    {
        return $this->belongsTo(User::class, 'generated_by_user_id');
    }
}
