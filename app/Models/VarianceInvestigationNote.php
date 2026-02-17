<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VarianceInvestigationNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_variance_investigation_id',
        'note_text',
        'note_type',
        'created_by_user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Note types
    const TYPE_INVESTIGATION = 'investigation';
    const TYPE_FINDING = 'finding';
    const TYPE_DECISION = 'decision';
    const TYPE_RESOLUTION = 'resolution';

    public function investigation()
    {
        return $this->belongsTo(StockVarianceInvestigation::class, 'stock_variance_investigation_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
