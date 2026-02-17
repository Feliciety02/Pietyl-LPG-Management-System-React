<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockVarianceInvestigation extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_count_id',
        'product_variant_id',
        'location_id',
        'variance_qty',
        'variance_direction',
        'system_qty',
        'counted_qty',
        'status',
        'investigation_notes',
        'assigned_to_user_id',
        'investigated_by_user_id',
        'root_cause',
        'action_taken',
        'approved_by_user_id',
        'approved_at',
        'approval_notes',
        'adjustment_qty',
        'write_off_reason',
        'cost_impact',
        'resolution_date',
        'created_by_user_id',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'resolution_date' => 'datetime',
        'cost_impact' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Statuses
    const STATUS_NEW = 'new';
    const STATUS_ASSIGNED = 'assigned';
    const STATUS_INVESTIGATING = 'investigating';
    const STATUS_ROOT_CAUSE_IDENTIFIED = 'root_cause_identified';
    const STATUS_PENDING_APPROVAL = 'pending_approval';
    const STATUS_APPROVED = 'approved';
    const STATUS_RESOLVED = 'resolved';
    const STATUS_CLOSED = 'closed';

    // Root causes
    const ROOT_CAUSE_DAMAGE = 'damage';
    const ROOT_CAUSE_THEFT = 'theft';
    const ROOT_CAUSE_RECORDING_ERROR = 'recording_error';
    const ROOT_CAUSE_SYSTEM_ERROR = 'system_error';
    const ROOT_CAUSE_SUPPLY_ERROR = 'supply_error';
    const ROOT_CAUSE_DELIVERY_ERROR = 'delivery_error';
    const ROOT_CAUSE_PACKAGING_ERROR = 'packaging_error';
    const ROOT_CAUSE_NATURAL_LOSS = 'natural_loss';
    const ROOT_CAUSE_UNKNOWN = 'unknown';

    // Action taken
    const ACTION_ADJUST_DOWN = 'adjust_down';
    const ACTION_ADJUST_UP = 'adjust_up';
    const ACTION_WRITE_OFF = 'write_off';
    const ACTION_SUBMIT_CLAIM = 'submit_claim';
    const ACTION_DISCIPLINARY = 'disciplinary';
    const ACTION_INVESTIGATION_ONLY = 'investigation_only';

    public function stockCount()
    {
        return $this->belongsTo(StockCount::class);
    }

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function investigatedBy()
    {
        return $this->belongsTo(User::class, 'investigated_by_user_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function notes()
    {
        return $this->hasMany(VarianceInvestigationNote::class);
    }

    public static function getStatusOptions()
    {
        return [
            self::STATUS_NEW => 'New',
            self::STATUS_ASSIGNED => 'Assigned to Investigator',
            self::STATUS_INVESTIGATING => 'Under Investigation',
            self::STATUS_ROOT_CAUSE_IDENTIFIED => 'Root Cause Identified',
            self::STATUS_PENDING_APPROVAL => 'Pending Approval',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_RESOLVED => 'Resolved',
            self::STATUS_CLOSED => 'Closed',
        ];
    }

    public static function getRootCauseOptions()
    {
        return [
            self::ROOT_CAUSE_DAMAGE => 'Product Damage',
            self::ROOT_CAUSE_THEFT => 'Possible Theft',
            self::ROOT_CAUSE_RECORDING_ERROR => 'Recording/Entry Error',
            self::ROOT_CAUSE_SYSTEM_ERROR => 'System/Software Error',
            self::ROOT_CAUSE_SUPPLY_ERROR => 'Supplier Supply Error',
            self::ROOT_CAUSE_DELIVERY_ERROR => 'Delivery/Transport Error',
            self::ROOT_CAUSE_PACKAGING_ERROR => 'Packaging/Unit Error',
            self::ROOT_CAUSE_NATURAL_LOSS => 'Natural Loss (Evaporation/Leakage)',
            self::ROOT_CAUSE_UNKNOWN => 'Unknown',
        ];
    }

    public static function getActionOptions()
    {
        return [
            self::ACTION_ADJUST_DOWN => 'Adjust Down (Write Off Loss)',
            self::ACTION_ADJUST_UP => 'Adjust Up (Recount Error)',
            self::ACTION_WRITE_OFF => 'Write Off Asset',
            self::ACTION_SUBMIT_CLAIM => 'Submit Insurance/Supplier Claim',
            self::ACTION_DISCIPLINARY => 'Disciplinary Action',
            self::ACTION_INVESTIGATION_ONLY => 'Investigation Only (No Action)',
        ];
    }

    public function canBeInvestigated(): bool
    {
        return in_array($this->status, [
            self::STATUS_NEW,
            self::STATUS_ASSIGNED,
        ]);
    }

    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_PENDING_APPROVAL;
    }
}
