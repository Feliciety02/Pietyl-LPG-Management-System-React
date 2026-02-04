<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_id',
        'product_variant_id',
        'product_name',
        'variant',
        'qty',
    ];

    protected $casts = [
        'qty' => 'integer',
    ];

    public function delivery()
    {
        return $this->belongsTo(Delivery::class);
    }

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
