<?php

namespace App\Services\Inventory;

use App\Models\Purchase;
use App\Models\User;
use App\Models\Location;
use App\Models\StockMovement;
use App\Repositories\PurchaseRepository;
use App\Services\Accounting\LedgerService;
use App\Services\Accounting\PayableService;
use App\Enums\PurchaseStatus;
use App\Exceptions\PurchaseStatusException;
use App\Models\InventoryBalance;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class PurchaseService
{
    public function __construct(
        private PurchaseRepository $purchaseRepository,
        private LedgerService $ledgerService,
        private PayableService $payableService
    ) {}

    public function getPurchasesForIndex(array $filters, int $perPage)
    {
        $purchases = $this->purchaseRepository->getPaginatedPurchases($filters, $perPage);

        $data = $this->transformPurchasesForIndex($purchases->getCollection());

        return [
            'data' => $data,
            'meta' => $this->getPaginationMeta($purchases),
        ];
    }

    public function getPurchaseDetails(int $id)
    {
        $purchase = $this->purchaseRepository->findById($id);
        return $this->transformPurchaseForShow($purchase);
    }

    public function createPurchase(array $validated, User $user)
    {
        $purchaseNumber = $this->purchaseRepository->generatePurchaseNumber();

        $unitCost = (float) ($validated['unit_cost'] ?? 0);
        $qty = (float) ($validated['qty'] ?? 0);
        $lineTotal = $qty * $unitCost;

        $status = $user->hasRole('admin') ? PurchaseStatus::AWAITING_CONFIRMATION : PurchaseStatus::PENDING;

        $purchasePayload = [
            'purchase_number' => $purchaseNumber,
            'supplier_id' => $validated['supplier_id'],
            'status' => $status,
            'subtotal' => $lineTotal,
            'grand_total' => $lineTotal,
            'notes' => $validated['notes'] ?? null,
            'ordered_at' => now(),
            'created_by_user_id' => $user->id,
        ];

        $purchase = $this->purchaseRepository->createPurchase($purchasePayload);

        $this->purchaseRepository->createPurchaseItem($purchase, [
            'product_variant_id' => $validated['product_variant_id'],
            'qty' => $qty,
            'received_qty' => 0,
            'unit_cost' => $unitCost,
            'line_total' => $lineTotal,
        ]);

        return $purchase->refresh();
    }

    public function approvePurchase(Purchase $purchase, string $actorRole, User $actor): Purchase
    {
        PurchaseStatus::ensureTransition($purchase->status, PurchaseStatus::RECEIVING, $actorRole);

        $this->purchaseRepository->updatePurchase($purchase, [
            'status' => PurchaseStatus::RECEIVING,
            'approved_at' => now(),
            'approved_by_user_id' => $actor->id,
        ]);

        $refreshed = $purchase->refresh();

        /*
          key change for your requirement
          as soon as admin approves, create the payable row
          this is the temporary payable that has no receipt yet
        */
        $this->payableService->syncPurchasePayable($refreshed, $actor);

        return $refreshed;
    }

    public function rejectPurchase(Purchase $purchase, string $actorRole, string $reason, ?User $actor = null): Purchase
    {
        PurchaseStatus::ensureTransition($purchase->status, PurchaseStatus::REJECTED, $actorRole);

        $this->purchaseRepository->updatePurchase($purchase, [
            'status' => PurchaseStatus::REJECTED,
            'rejected_reason' => $reason,
            'rejected_at' => now(),
            'rejected_by_user_id' => $actor?->id,
        ]);

        return $purchase->refresh();
    }

    public function markDelivered(Purchase $purchase, array $payload, User $actor): Purchase
    {
        $item = $purchase->items()->first();
        $orderedQty = max(0, (float) ($item?->qty ?? 0));

        $deliveredQty = max(0, (float) ($payload['delivered_qty'] ?? 0));
        $damagedQty = max(0, min($deliveredQty, (float) ($payload['damaged_qty'] ?? 0)));
        $missingQty = max(0, $orderedQty - $deliveredQty);
        $receivedGood = max(0, $deliveredQty - $damagedQty);

        $this->purchaseRepository->updatePurchase($purchase, [
            'status' => PurchaseStatus::RECEIVED,
            'received_at' => now(),
            'delivered_qty' => $deliveredQty,
            'damaged_qty' => $damagedQty,
            'missing_qty' => $missingQty,
            'damage_category' => $payload['damage_category'] ?? null,
            'damage_reason' => $payload['damage_reason'] ?? null,
            'supplier_reference_no' => $payload['supplier_reference'] ?? null,
            'delivery_reference_no' => $payload['delivery_reference'] ?? null,
        ]);

        if ($item && $receivedGood > 0) {
            $location = Location::orderBy('id')->first();
            
            if ($location) {
                // Create stock movement record
                StockMovement::create([
                    'location_id' => $location->id,
                    'product_variant_id' => $item->product_variant_id,
                    'movement_type' => StockMovement::TYPE_PURCHASE_IN,
                    'qty' => $receivedGood,
                    'reference_type' => Purchase::class,
                    'reference_id' => $purchase->id,
                    'performed_by_user_id' => $actor->id,
                    'moved_at' => now(),
                    'notes' => 'Stock-in from delivery: ' . $purchase->purchase_number,
                ]);

                // Update inventory balance - add to qty_filled
                $balance = InventoryBalance::where('location_id', $location->id)
                    ->where('product_variant_id', $item->product_variant_id)
                    ->first();

                if ($balance) {
                    $balance->increment('qty_filled', $receivedGood);
                } else {
                    InventoryBalance::create([
                        'location_id' => $location->id,
                        'product_variant_id' => $item->product_variant_id,
                        'qty_filled' => $receivedGood,
                        'qty_empty' => 0,
                        'qty_reserved' => 0,
                        'reorder_level' => 0,
                    ]);
                }
            }
        }

        // Update payable with actual amounts after deductions
        $refreshedPurchase = $purchase->refresh();
        $this->payableService->syncPurchasePayable($refreshedPurchase, $actor);
        return $refreshedPurchase;
    }

    public function reportDiscrepancy(Purchase $purchase, string $actorRole, ?User $actor = null): Purchase
    {
        PurchaseStatus::ensureTransition($purchase->status, PurchaseStatus::DISCREPANCY_REPORTED, $actorRole);

        $this->purchaseRepository->updatePurchase($purchase, [
            'status' => PurchaseStatus::DISCREPANCY_REPORTED,
            'discrepancy_reported_at' => now(),
            'discrepancy_reported_by_user_id' => $actor?->id,
        ]);

        return $purchase->refresh();
    }

    /*
      optional legacy function
      your current UI flow uses markDelivered instead
      keeping this to avoid route crashes if it is still used somewhere
    */
    public function confirmPurchase(Purchase $purchase, array $validated, User $user): void
    {
        $location = Location::first();

        $item = $purchase->items()->first();
        if (!$item) {
            return;
        }

        $receivedQty = (float) ($validated['received_qty'] ?? 0);

        $this->purchaseRepository->updatePurchaseItem($item, [
            'received_qty' => $receivedQty,
            'line_total' => $receivedQty * (float) $item->unit_cost,
        ]);

        if ($location) {
            $this->purchaseRepository->createStockMovement([
                'location_id' => $location->id,
                'product_variant_id' => $item->product_variant_id,
                'movement_type' => StockMovement::TYPE_PURCHASE_IN,
                'qty' => $receivedQty,
                'reference_type' => Purchase::class,
                'reference_id' => $purchase->id,
                'performed_by_user_id' => $user->id,
                'moved_at' => Carbon::now(),
                'notes' => $validated['notes'] ?? 'Purchase confirmed',
            ]);

            $this->purchaseRepository->updateOrCreateInventoryBalance(
                $location->id,
                $item->product_variant_id,
                $receivedQty
            );
        }

        $totalCost = $receivedQty * (float) $item->unit_cost;
        if ($totalCost > 0) {
            $this->ledgerService->postEntry([
                'entry_date' => Carbon::now()->toDateString(),
                'reference_type' => 'purchase',
                'reference_id' => $purchase->id,
                'created_by_user_id' => $user->id,
                'memo' => "Purchase {$purchase->purchase_number}",
                'lines' => [
                    [
                        'account_code' => '1200',
                        'debit' => $totalCost,
                        'credit' => 0,
                        'description' => 'Inventory received',
                    ],
                    [
                        'account_code' => '2100',
                        'debit' => 0,
                        'credit' => $totalCost,
                        'description' => 'Accounts payable for supplier',
                    ],
                ],
            ]);
        }
    }

    public function recordPayment(Purchase $purchase, array $payload, User $actor, string $actorRole): Purchase
    {
        PurchaseStatus::ensureTransition($purchase->status, PurchaseStatus::PAID, $actorRole);

        $this->purchaseRepository->updatePurchase($purchase, [
            'status' => PurchaseStatus::PAID,
            'paid_at' => now(),
            'paid_by_user_id' => $actor->id,
            'payment_method' => $payload['payment_method'] ?? null,
            'bank_ref' => $payload['reference'] ?? null,
        ]);

        return $purchase->refresh();
    }

    public function completePurchase(Purchase $purchase, ?User $actor = null): Purchase
    {
        $fromRaw = $purchase->status;
        $from = PurchaseStatus::normalize($fromRaw);

        if ($from !== PurchaseStatus::PAID) {
            throw ValidationException::withMessages([
                'status' => ['Purchase cannot be completed yet. It must be marked as paid first.'],
            ]);
        }

        $actorRole = $actor?->getRoleNames()->first();
        PurchaseStatus::ensureTransition($fromRaw, PurchaseStatus::COMPLETED, $actorRole);

        $this->purchaseRepository->updatePurchase($purchase, [
            'status' => PurchaseStatus::COMPLETED,
            'completed_at' => now(),
            'completed_by_user_id' => $actor?->id,
        ]);

        return $purchase->refresh();
    }

    public function closePurchase(Purchase $purchase, ?string $actorRole = null, array $payload = []): Purchase
    {
        PurchaseStatus::ensureTransition($purchase->status, PurchaseStatus::CLOSED, $actorRole);

        $this->purchaseRepository->updatePurchase($purchase, [
            'status' => PurchaseStatus::CLOSED,
            'closed_at' => now(),
        ]);

        return $purchase->refresh();
    }

    public function deletePurchase(Purchase $purchase): void
    {
        $this->purchaseRepository->deletePurchase($purchase);
    }

    public function purgeAllPurchases(): int
    {
        return $this->purchaseRepository->purgeAllPurchases();
    }

    public function getProductsWithSuppliers()
    {
        $productVariants = $this->purchaseRepository->getProductVariantsWithSuppliers();

        $suppliersByProduct = [];
        $products = [];

        foreach ($productVariants as $variant) {
            $baseCost = (float) ($variant->product?->supplier_cost ?? 0);

            $variantSuppliers = $variant->suppliers->map(function ($s) use ($baseCost) {
                $pivotCost = (float) ($s->pivot->supplier_cost ?? 0);
                $resolvedCost = $pivotCost > 0 ? $pivotCost : $baseCost;

                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'is_primary' => $s->pivot->is_primary,
                    'lead_time_days' => $s->pivot->lead_time_days,
                    'unit_cost' => $resolvedCost,
                    'supplier_cost' => $resolvedCost,
                ];
            })->values();

            if ($variantSuppliers->isEmpty() && $variant->product?->supplier_id) {
                $fallbackSupplier = $variant->product?->supplier;
                $variantSuppliers = collect([[
                    'id' => $variant->product->supplier_id,
                    'name' => $fallbackSupplier?->name ?? 'Supplier',
                    'is_primary' => true,
                    'lead_time_days' => null,
                    'unit_cost' => $baseCost,
                    'supplier_cost' => $baseCost,
                ]]);
            }

            $suppliersByProduct[$variant->id] = ['suppliers' => $variantSuppliers];

            $products[] = [
                'id' => $variant->id,
                'product_id' => $variant->product_id,
                'sku' => $variant->product?->sku,
                'product_name' => $variant->product?->name ?? '-',
                'variant_name' => $variant->variant_name ?? '',
                'supplier_cost' => (float) ($variant->product?->supplier_cost ?? 0),
                'price' => (float) ($variant->product?->price ?? 0),
            ];
        }

        return [
            'products' => $products,
            'suppliersByProduct' => $suppliersByProduct,
        ];
    }

    public function getProductSupplierMaps()
    {
        $productVariants = $this->purchaseRepository->getProductVariantsWithSuppliers();

        $productsMap = [];
        $suppliersMap = [];

        foreach ($productVariants as $variant) {
            $productsMap[$variant->id] = [
                'id' => $variant->id,
                'product_name' => $variant->product->name ?? '-',
                'variant_name' => $variant->variant_name ?? '',
                'supplier_id' => null,
            ];

            $primarySupplier = $variant->suppliers->firstWhere('pivot.is_primary', true)
                ?? $variant->suppliers->first();

            if ($primarySupplier) {
                $productsMap[$variant->id]['supplier_id'] = $primarySupplier->id;

                if (!isset($suppliersMap[$primarySupplier->id])) {
                    $suppliersMap[$primarySupplier->id] = [
                        'id' => $primarySupplier->id,
                        'name' => $primarySupplier->name,
                        'variants' => [],
                    ];
                }

                $suppliersMap[$primarySupplier->id]['variants'][$variant->id] = [
                    'unit_cost' => (float) ($primarySupplier->pivot->supplier_cost ?? 0),
                    'is_primary' => $primarySupplier->pivot->is_primary ?? false,
                    'lead_time_days' => $primarySupplier->pivot->lead_time_days ?? 0,
                ];
            }
        }

        return [
            'productsMap' => $productsMap,
            'suppliersMap' => $suppliersMap,
        ];
    }

    protected function transformPurchasesForIndex($purchases)
    {
        return $purchases->map(function ($purchase) {
            $item = $purchase->items->first();

            return [
                'id' => $purchase->id,
                'reference_no' => $purchase->purchase_number,
                'supplier_name' => $purchase->supplier->name ?? '-',
                'product_name' => $item?->productVariant?->product?->name ?? '-',
                'variant' => $item?->productVariant?->variant_name ?? '-',
                'qty' => (float) ($item->qty ?? 0),
                'received_qty' => (float) ($item->received_qty ?? 0),
                'unit_cost' => (float) ($item->unit_cost ?? 0),
                'total_cost' => (float) ($item->line_total ?? 0),
                'status' => $purchase->status,
                'created_at' => $purchase->created_at->format('M d h:i A'),
            ];
        })->values();
    }

    protected function transformPurchaseForShow($purchase)
    {
        return [
            'id' => $purchase->id,
            'reference_no' => $purchase->purchase_number,
            'supplier_name' => $purchase->supplier->name ?? '-',
            'status' => $purchase->status,
            'ordered_at' => $purchase->ordered_at,
            'received_at' => $purchase->received_at,
            'subtotal' => (float) $purchase->subtotal,
            'grand_total' => (float) $purchase->grand_total,
            'items' => $purchase->items->map(function ($item) {
                return [
                    'product_name' => $item->productVariant->product->name ?? '-',
                    'variant' => $item->productVariant->name ?? '-',
                    'qty' => (float) $item->qty,
                    'unit_cost' => (float) $item->unit_cost,
                    'line_total' => (float) $item->line_total,
                    'received_qty' => (float) ($item->received_qty ?? 0),
                ];
            }),
        ];
    }

    protected function getPaginationMeta($paginator)
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'total' => $paginator->total(),
        ];
    }
}
