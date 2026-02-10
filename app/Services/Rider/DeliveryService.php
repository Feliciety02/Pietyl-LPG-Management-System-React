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
    $normalized = $this->normalizeStatus($newStatus);

    if ($normalized === Delivery::STATUS_IN_TRANSIT) {
        $this->deliveryRepository->setDispatched($delivery);
        $this->deliveryRepository->updateStatus($delivery, $normalized);
        return;
    }

    if ($normalized === Delivery::STATUS_DELIVERED) {
        $this->processDeliveredStatus($delivery, $user);
        $this->deliveryRepository->updateStatus($delivery, $normalized);
        return;
    }

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
     * Process delivered status - stock out items
     */
    private function processDeliveredStatus(Delivery $delivery, User $user): void
{
    $locationId = (int) ($user->location_id ?? 1);

    $delivery->loadMissing([
        'sale.items.productVariant',
    ]);

    $sale = $delivery->sale;

    if (!$sale) {
        abort(422, 'Delivery has no linked sale.');
    }

    if (($sale->items?->count() ?? 0) === 0) {
        abort(422, 'No sale items found for this delivery.');
    }

    try {
        foreach ($sale->items as $item) {
            $this->inventoryService->stockOut(
                productVariantId: (int) $item->product_variant_id,
                locationId: $locationId,
                qty: (int) $item->qty,
                userId: (int) $user->id,
                referenceType: 'delivery',
                referenceId: (string) $delivery->id
            );
        }
    } catch (\Throwable $e) {
        abort(422, 'Unable to mark delivered. Inventory error: ' . $e->getMessage());
    }

    $this->deliveryRepository->setDelivered($delivery);
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
     * Validate status transition
     */
    private function validateStatusTransition(string $fromStatus, string $toStatus): void
    {
        $from = strtolower($fromStatus);

        $allowedTransitions = [
            Delivery::STATUS_PENDING => [
                Delivery::STATUS_IN_TRANSIT,
                Delivery::STATUS_FAILED,
                Delivery::STATUS_CANCELLED
            ],
            Delivery::STATUS_IN_TRANSIT => [
                Delivery::STATUS_DELIVERED,
                Delivery::STATUS_FAILED,
                Delivery::STATUS_CANCELLED
            ],
        ];

        if (isset($allowedTransitions[$from]) && !in_array($toStatus, $allowedTransitions[$from], true)) {
            abort(422, 'Invalid status transition.');
        }
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
                'name' => $fullName !== '' ? $fullName : 'Item',
                'qty' => (int) ($item->qty ?? 0),
            ];
        })->values(),

        'notes' => (string) ($delivery->notes ?? ''),
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