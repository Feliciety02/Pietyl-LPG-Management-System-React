<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'vat_registered',
        'vat_rate',
        'vat_effective_date',
        'vat_mode',
        'manager_pin_hash',
    ];

    protected $casts = [
        'vat_registered' => 'boolean',
        'vat_rate' => 'decimal:4',
        'vat_effective_date' => 'date',
    ];
}
