<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'customer_type',
        'notes',
    ];

    // Relationships
    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }


    //TODO: ADD RELATIONSHIPS HERE IF NEEDED
    //public function sales(): HasMany
    //{
        //return $this->hasMany(Sale::class);
    //}


    //public function deliveries(): HasMany
    //{
        //return $this->hasMany(Delivery::class);
    //}

    //public function cylinderTransactions(): HasMany
    //{
        //return $this->hasMany(CylinderTransaction::class);
    //}

    // Scopes
    public function scopeWalkin($query)
    {
        return $query->where('customer_type', 'walkin');
    }

    public function scopeRegular($query)
    {
        return $query->where('customer_type', 'regular');
    }

    public function scopeCorporate($query)
    {
        return $query->where('customer_type', 'corporate');
    }

    // Helper methods
    public function getDefaultAddress()
    {
        return $this->addresses()->where('is_default', true)->first();
    }

    public function isWalkin(): bool
    {
        return $this->customer_type === 'walkin';
    }
}