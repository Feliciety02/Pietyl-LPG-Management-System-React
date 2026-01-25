<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'method_key',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    //TODO: ADD RELATIONSHIPS HERE IF NEEDED
    //public function payments(): HasMany
    //{
        //return $this->hasMany(Payment::class);
    //}

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Helper methods
    public function isCash(): bool
    {
        return $this->method_key === 'cash';
    }

    public function requiresReference(): bool
    {
        return in_array($this->method_key, ['gcash', 'card', 'bank_transfer']);
    }
}