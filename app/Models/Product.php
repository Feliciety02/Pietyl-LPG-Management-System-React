<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'sku',
        'name',
        'category',
        'is_active',
        'created_by_user_id',
    ];

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }
}