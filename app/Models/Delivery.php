<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

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
        'proof_photo_url',
        'proof_signature_url',
        'proof_geo_lat',
        'proof_geo_lng',
        'proof_captured_at',
        'proof_exceptions',
        'delivered_items',
        'notes',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'delivered_at' => 'datetime',
        'proof_captured_at' => 'datetime',
        'delivered_items' => 'array',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function address()
    {
        return $this->belongsTo(CustomerAddress::class, 'address_id');
    }

    public function rider()
    {
        return $this->belongsTo(User::class, 'assigned_rider_user_id');
    }

    public function items()
    {
        return $this->hasMany(DeliveryItem::class);
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('delivery_number', 'like', "%{$search}%")
              ->orWhereHas('customer', function ($q) use ($search) {
                  $q->where('name', 'like', "%{$search}%");
              });
        });
    }

    public static function generateDeliveryNumber()
    {
        $prefix = 'D-';
        $lastDelivery = self::latest('id')->first();
        $number = $lastDelivery ? intval(substr($lastDelivery->delivery_number, strlen($prefix))) + 1 : 1;

        return $prefix . str_pad($number, 6, '0', STR_PAD_LEFT);
    }

    public function proofStorageDisk(string $kind): ?string
    {
        return $this->resolveProofStorage($kind)['disk'];
    }

    public function proofStoragePath(string $kind): ?string
    {
        return $this->resolveProofStorage($kind)['path'];
    }

    public function hasProof(string $kind): bool
    {
        return $this->proofStoragePath($kind) !== null;
    }

    public function canAccessProof(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        if ((int) $this->assigned_rider_user_id === (int) $user->id) {
            return true;
        }

        if ($this->sale && (int) $this->sale->cashier_user_id === (int) $user->id) {
            return true;
        }

        return $user->hasAnyRole(['admin', 'accountant', 'inventory_manager']);
    }

    private function resolveProofStorage(string $kind): array
    {
        $value = $this->proofValueForKind($kind);
        if (!$value) {
            return ['disk' => null, 'path' => null];
        }

        if ($this->looksLikeLegacyPublicUrl($value)) {
            $path = parse_url($value, PHP_URL_PATH) ?: $value;
            $path = Str::after($path, '/storage/');
            $path = ltrim($path, '/');

            return [
                'disk' => $path !== '' ? 'public' : null,
                'path' => $path !== '' ? $path : null,
            ];
        }

        return [
            'disk' => 'local',
            'path' => ltrim($value, '/'),
        ];
    }

    private function proofValueForKind(string $kind): ?string
    {
        $value = match ($kind) {
            'photo' => $this->proof_photo_url,
            'signature' => $this->proof_signature_url,
            default => null,
        };

        if (!$value && $this->proof_type === $kind) {
            $value = $this->proof_url;
        }

        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }

    private function looksLikeLegacyPublicUrl(string $value): bool
    {
        return Str::startsWith($value, ['/storage/', 'http://', 'https://'])
            && str_contains($value, '/storage/');
    }

    const STATUS_PENDING = 'pending';
    const STATUS_ASSIGNED = 'assigned';
    const STATUS_DISPATCHED = 'dispatched';
    const STATUS_IN_TRANSIT = 'in_transit';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';
}
