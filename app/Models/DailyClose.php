<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyClose extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_date',
        'finalized_by_user_id',
        'finalized_at',
    ];

    protected $casts = [
        'business_date' => 'date',
        'finalized_at' => 'datetime',
    ];

    public function finalizedBy()
    {
        return $this->belongsTo(User::class, 'finalized_by_user_id');
    }
}
