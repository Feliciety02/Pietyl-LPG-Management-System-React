<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_number',
        'sale_id',
        'customer_id',
        'address_id',
        'assigned_rider_user_id',
        'status',
        'scheduled_at',
        'dispatched_at',
        'delivered_at',
        'proof_type',
        'proof_url',
        'notes',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    /**
     * Get the sale.
     */
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Get the customer.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the delivery address.
     */
    public function address()
    {
        return $this->belongsTo(CustomerAddress::class, 'address_id');
    }

    /**
     * Get the assigned rider.
     */
    public function rider()
    {
        return $this->belongsTo(User::class, 'assigned_rider_user_id');
    }

    /**
     * Get the status logs for the delivery.
     */
    //public function statusLogs()
    //{
        //return $this->hasMany(DeliveryStatusLog::class);
    //}

    /**
     * Scope a query to only include deliveries with a given status.
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to search deliveries.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('delivery_number', 'like', "%{$search}%")
              ->orWhereHas('customer', function ($q) use ($search) {
                  $q->where('name', 'like', "%{$search}%");
              });
        });
    }

    /**
     * Generate a unique delivery number.
     */
    public static function generateDeliveryNumber()
    {
        $prefix = 'D-';
        $lastDelivery = self::latest('id')->first();
        $number = $lastDelivery ? intval(substr($lastDelivery->delivery_number, strlen($prefix))) + 1 : 1;
        
        return $prefix . str_pad($number, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Common delivery statuses
     */
    const STATUS_PENDING = 'pending';
    const STATUS_ASSIGNED = 'assigned';
    const STATUS_DISPATCHED = 'dispatched';
    const STATUS_IN_TRANSIT = 'in_transit';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';
}