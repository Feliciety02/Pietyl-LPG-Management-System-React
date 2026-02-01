<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockCount extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_balance_id',
        'product_variant_id',
        'location_id',
        'system_filled',
        'system_empty',
        'counted_filled',
        'counted_empty',
        'variance_filled',
        'variance_empty',
        'status',
        'note',
        'created_by_user_id',
        'submitted_at',
        'reviewed_by_user_id',
        'reviewed_at',
        'review_note',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function inventoryBalance()
    {
        return $this->belongsTo(InventoryBalance::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }
}
