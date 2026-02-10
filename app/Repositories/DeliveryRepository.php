<?php

namespace App\Repositories;

use App\Models\Delivery;
use Illuminate\Support\Collection;
use App\Models\User;

class DeliveryRepository
{
    /**
     * Get deliveries for a specific rider with filters
     */
    public function getDeliveriesByRider(int $riderId, ?string $search = null, ?string $status = null): Collection
    {
        $query = Delivery::query()
            ->with([
                'customer', 
                'address', 
                'items',
                'sale.items.productVariant.product',
                'sale.payments.paymentMethod',
            ])
            ->where('assigned_rider_user_id', $riderId)
            ->orderByDesc('created_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('delivery_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($qc) use ($search) {
                        $qc->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('address', function ($qa) use ($search) {
                        $qa->where('address_line', 'like', "%{$search}%");
                    });
            });
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        
        return $query->get();
    }

    /**
     * Find delivery by ID with items loaded
     */
    public function findById(int $id): ?Delivery
    {
        return Delivery::with(['items'])->find($id);
    }

    /**
     * Update delivery status
     */
    public function updateStatus(Delivery $delivery, string $status): bool
    {
        $delivery->status = $status;
        return $delivery->save();
    }

    /**
     * Update delivery note
     */
    public function updateNote(Delivery $delivery, ?string $note): bool
    {
        $delivery->notes = $note;
        return $delivery->save();
    }

    /**
     * Set dispatched timestamp
     */
    public function setDispatched(Delivery $delivery): bool
    {
        if (!$delivery->dispatched_at) {
            $delivery->dispatched_at = now();
            return $delivery->save();
        }
        return true;
    }

    /**
     * Set delivered timestamp
     */
    public function setDelivered(Delivery $delivery): bool
    {
        $delivery->delivered_at = now();
        return $delivery->save();
    }
    /**
     * Get delivery history with filters and pagination
     */
    public function getDeliveryHistory(int $riderId, array $filters = [], int $perPage = 10)
    {
        $query = Delivery::with(['sale.items.productVariant.product', 'customer', 'address'])
            ->where('assigned_rider_user_id', $riderId)
            ->whereIn('status', ['delivered', 'failed']);

        // Search filter
        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $query->where(function($sub) use ($q) {
                $sub->where('delivery_number', 'like', "%{$q}%")
                    ->orWhereHas('customer', function($c) use ($q) {
                        $c->where('name', 'like', "%{$q}%");
                    })
                    ->orWhereHas('address', function($a) use ($q) {
                        $a->where('address_line1', 'like', "%{$q}%")
                        ->orWhere('city', 'like', "%{$q}%");
                    });
            });
        }

        // Status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        // Payment filter
        if (!empty($filters['payment']) && $filters['payment'] !== 'all') {
            $payment = $filters['payment'];
            $query->whereHas('sale', function($s) use ($payment) {
                if ($payment === 'prepaid' || $payment === 'paid') {
                    $s->where('status', 'paid');
                } else {
                    $s->where('status', '!=', 'paid');
                }
            });
        }

        // Date range filter
        if (!empty($filters['date_from'])) {
            $query->whereDate('delivered_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('delivered_at', '<=', $filters['date_to']);
        }

        // Order by most recent first
        $query->orderBy('delivered_at', 'desc');

        return $query->paginate($perPage);
    }

    public function createDelivery(array $data): Delivery
    {
        return Delivery::create($data);
    }

    public function getRiders(): Collection
    {
        return User::whereHas('roles', function($q) {
            $q->where('name', 'rider');
        })->get();
    }

    public function getActiveDeliveryCount(int $riderId): int
    {
        return Delivery::where('assigned_rider_user_id', $riderId)
            ->whereIn('status', [
                Delivery::STATUS_PENDING,
                Delivery::STATUS_ASSIGNED,
                Delivery::STATUS_IN_TRANSIT,
            ])
            ->count();
    }

    public function generateDeliveryNumber(): string
    {
        return Delivery::generateDeliveryNumber();
    }
}