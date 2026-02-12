<?php

namespace App\Services\Rider;

use App\Models\Delivery;
use App\Models\User;
use App\Repositories\DeliveryRepository;
use App\Services\Inventory\InventoryService;
use Illuminate\Support\Collection;

class DeliveryService
{
    public function __construct(
        private DeliveryRepository $deliveryRepository,
        private InventoryService $inventoryService
    ) {}

    /**
     * Get all deliveries for a rider with formatting
     */
    public function getRiderDeliveries(User $rider, ?string $search, ?string $status): Collection
    {
        $deliveries = $this->deliveryRepository->getDeliveriesByRider($rider->id, $search, $status);
       
         
        return $deliveries->map(function ($delivery) {
            return $this->formatDeliveryForDisplay($delivery);
        });
    }

    /**
     * Update delivery status with business logic
     */
    public function updateDeliveryStatus(Delivery $delivery, string $newStatus, User $user): void
    {
        \Log::info('=== UPDATE STATUS START ===', [
            'delivery_id' => $delivery->id,
            'current_status' => $delivery->status,
            'new_status' => $newStatus,
        ]);
        
        $normalized = $this->normalizeStatus($newStatus);
        
        \Log::info('Normalized status', ['normalized' => $normalized]);

        if ($normalized === Delivery::STATUS_IN_TRANSIT) {
            \Log::info('Setting in_transit');
            $this->deliveryRepository->setDispatched($delivery);
            $this->deliveryRepository->updateStatus($delivery, $normalized);
            return;
        }

        if ($normalized === Delivery::STATUS_DELIVERED) {
            \Log::info('Processing delivered status');
            $this->processDeliveredStatus($delivery, $user);
            \Log::info('Updating to delivered');
            $this->deliveryRepository->updateStatus($delivery, $normalized);
            \Log::info('=== UPDATE STATUS COMPLETE ===');
            return;
        }

        \Log::info('Updating status directly', ['status' => $normalized]);
        $this->deliveryRepository->updateStatus($delivery, $normalized);
    }

    /**
     * Update delivery note
     */
    public function updateDeliveryNote(Delivery $delivery, ?string $note): void
    {
        $this->deliveryRepository->updateNote($delivery, $note);
    }

    /**
     * Verify rider owns the delivery
     */
    public function verifyRiderOwnsDelivery(Delivery $delivery, User $rider): bool
    {
        return (int) $delivery->assigned_rider_user_id === (int) $rider->id;
    }

    /**
     * Process delivered status - just mark as delivered
     */
    private function processDeliveredStatus(Delivery $delivery, User $user): void
    {
        \Log::info('processDeliveredStatus called');
        $this->deliveryRepository->setDelivered($delivery);
        \Log::info('setDelivered complete');
    }

    /**
     * Normalize status (convert "on_the_way" to "in_transit")
     */
    private function normalizeStatus(string $status): string
    {
        $status = strtolower(trim($status));
        return $status === 'on_the_way' ? Delivery::STATUS_IN_TRANSIT : $status;
    }

    /**
     * Format delivery for display
     */
    private function formatDeliveryForDisplay(Delivery $delivery): array
    {
        $delivery->loadMissing([
            'customer',
            'address',
            'sale.items.productVariant.product',
        ]);

        return [
            'id' => $delivery->id,
            'code' => $delivery->delivery_number,
            'delivery_type' => 'delivery',
            'scheduled_at' => $delivery->scheduled_at?->format('M d, Y g:i A') ?? '',
            'created_at' => $delivery->created_at?->format('Y-m-d H:i') ?? '',
            'status' => (string) $delivery->status,
            'customer_name' => $delivery->customer?->name ?? 'Customer',
            'customer_phone' => $delivery->customer?->phone ?? '',
            'address' => $this->formatAddress($delivery),
            'barangay' => $delivery->address?->barangay ?? '',
            'landmark' => $delivery->address?->landmark ?? '',
            'instructions' => $delivery->address?->instructions ?? '',
            'payment_method' => $delivery->sale?->payment_method ?? '',
            'payment_status' => $delivery->sale?->payment_status ?? '',
            'amount_total' => $delivery->sale?->grand_total ?? 0,
            'delivery_fee' => $delivery->sale?->delivery_fee ?? 0,
            'distance_km' => $delivery->distance_km ?? '',
            'eta_mins' => $delivery->eta_mins ?? '',

            'items' => ($delivery->sale?->items ?? collect())->map(function ($item) {
                $productName = $item->productVariant?->product?->name ?? '';
                $variantName = $item->productVariant?->variant_name ?? '';

                $fullName = trim($productName . ' ' . ($variantName !== '' ? '(' . $variantName . ')' : ''));

                return [
                    'id' => (int) ($item->id ?? 0),
                    'sale_item_id' => (int) ($item->id ?? 0),
                    'product_variant_id' => (int) ($item->product_variant_id ?? 0),
                    'name' => $fullName !== '' ? $fullName : 'Item',
                    'qty' => (int) ($item->qty ?? 0),
                    'ordered_qty' => (int) ($item->qty ?? 0),
                ];
            })->values(),

            'notes' => (string) ($delivery->notes ?? ''),
            'proof_photo_url' => (string) ($delivery->proof_photo_url ?? ($delivery->proof_type === 'photo' ? $delivery->proof_url : '')),
            'proof_signature_url' => (string) ($delivery->proof_signature_url ?? ($delivery->proof_type === 'signature' ? $delivery->proof_url : '')),
            'proof_geo_lat' => $delivery->proof_geo_lat ?? null,
            'proof_geo_lng' => $delivery->proof_geo_lng ?? null,
            'proof_captured_at' => $delivery->proof_captured_at?->toIso8601String() ?? '',
            'proof_exceptions' => (string) ($delivery->proof_exceptions ?? ''),
            'delivered_items' => $delivery->delivered_items ?? [],
        ];
    }

    /**
     * Format address for display
     */
    private function formatAddress(Delivery $delivery): string
    {
        if (!$delivery->address) {
            return '';
        }

        $parts = array_filter([
            $delivery->address->address_line ?? null,
            $delivery->address->barangay ?? null,
            $delivery->address->city ?? null,
            $delivery->address->province ?? null,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Get rider delivery history with pagination
     */
    public function getRiderDeliveryHistory(User $rider, array $filters = [], int $perPage = 10): array
    {
        $deliveries = $this->deliveryRepository->getDeliveryHistory($rider->id, $filters, $perPage);

        $mapped = $deliveries->map(function ($delivery) {
            $address = $delivery->address 
                ? trim(($delivery->address->address_line1 ?? '') . ' ' . ($delivery->address->address_line2 ?? '')) . ', ' . ($delivery->address->city ?? '')
                : 'No address';

            return [
                'id' => $delivery->id,
                'code' => $delivery->delivery_number,
                'delivered_at' => $delivery->delivered_at?->format('Y-m-d H:i'),
                'customer_name' => $delivery->customer?->name,
                'address' => $address,
                'items_count' => $delivery->sale?->items->count() ?? 0,
                'status' => $delivery->status,
                'payment_status' => $delivery->sale?->status === 'paid' ? 'prepaid' : 'unpaid',
            ];
        });

        return [
            'data' => $mapped,
            'meta' => [
                'current_page' => $deliveries->currentPage(),
                'last_page' => $deliveries->lastPage(),
                'from' => $deliveries->firstItem(),
                'to' => $deliveries->lastItem(),
                'total' => $deliveries->total(),
                'per_page' => $deliveries->perPage(),
            ],
        ];
    }
}
