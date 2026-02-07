<?php


namespace App\Services\Inventory;

use App\Models\Purchase;
use App\Models\Location;
use App\Models\StockMovement;
use App\Repositories\PurchaseRepository;
use App\Services\Accounting\LedgerService;
use Carbon\Carbon;

class PurchaseService
{
    public function __construct(
        private PurchaseRepository $purchaseRepository,
        private LedgerService $ledgerService
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

    public function createPurchase(array $validated, $user)
    {
        $purchaseNumber = $this->purchaseRepository->generatePurchaseNumber();
        
        $unitCost = $validated['unit_cost'] ?? 0;
        $lineTotal = $validated['qty'] * $unitCost;
        
        $status = $user->hasRole('admin') ? 'awaiting_confirmation' : 'pending';

        $purchase = $this->purchaseRepository->createPurchase([
            'purchase_number' => $purchaseNumber,
            'supplier_id' => $validated['supplier_id'],
            'created_by_user_id' => auth()->id(),
            'status' => $status,
            'subtotal' => $lineTotal,
            'grand_total' => $lineTotal,
            'notes' => $validated['notes'] ?? null,
            'ordered_at' => now(),
        ]);

        $this->purchaseRepository->createPurchaseItem($purchase, [
            'product_variant_id' => $validated['product_variant_id'],
            'qty' => $validated['qty'],
            'received_qty' => 0,
            'unit_cost' => $unitCost,
            'line_total' => $lineTotal,
        ]);

        return $purchase;
    }

    public function approvePurchase(Purchase $purchase)
    {
        return $this->purchaseRepository->updatePurchase($purchase, ['status' => 'approved']);
    }

    public function rejectPurchase(Purchase $purchase)
    {
        return $this->purchaseRepository->updatePurchase($purchase, ['status' => 'rejected']);
    }

    public function markDelivered(Purchase $purchase)
    {
        return $this->purchaseRepository->updatePurchase($purchase, [
            'status' => 'delivered',
            'received_at' => now(),
        ]);
    }

    public function confirmPurchase(Purchase $purchase, array $validated, $user)
    {
        $location = Location::first();

        $this->purchaseRepository->updatePurchase($purchase, [
            'status' => 'completed',
            'received_at' => now(),
        ]);

        $item = $purchase->items()->first();
        if ($item) {
            $receivedQty = (float) $validated['received_qty'];
            $this->purchaseRepository->updatePurchaseItem($item, [
                'received_qty' => $receivedQty,
                'line_total' => $receivedQty * $item->unit_cost,
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
    }

    public function reportDiscrepancy(Purchase $purchase)
    {
        return $this->purchaseRepository->updatePurchase($purchase, ['status' => 'discrepancy_reported']);
    }

    public function getProductsWithSuppliers()
    {
        $productVariants = $this->purchaseRepository->getProductVariantsWithSuppliers();

        $suppliersByProduct = [];
        $products = [];

        foreach ($productVariants as $variant) {
            $variantSuppliers = $variant->suppliers->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'is_primary' => $s->pivot->is_primary,
                'lead_time_days' => $s->pivot->lead_time_days,
                'unit_cost' => (float) ($s->pivot->unit_cost ?? 0),
            ])->values();

            $suppliersByProduct[$variant->id] = ['suppliers' => $variantSuppliers];

            $products[] = [
                'id' => $variant->id,
                'product_name' => $variant->product?->name ?? '—',
                'variant_name' => $variant->variant_name ?? '',
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
                'product_name' => $variant->product->name ?? '—',
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
                'supplier_name' => $purchase->supplier->name ?? '—',
                'product_name' => $item?->productVariant?->product?->name ?? '—',
                'variant' => $item?->productVariant?->variant_name ?? '—',
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
            'supplier_name' => $purchase->supplier->name ?? '—',
            'status' => $purchase->status,
            'ordered_at' => $purchase->ordered_at,
            'received_at' => $purchase->received_at,
            'subtotal' => (float) $purchase->subtotal,
            'grand_total' => (float) $purchase->grand_total,
            'items' => $purchase->items->map(function ($item) {
                return [
                    'product_name' => $item->productVariant->product->name ?? '—',
                    'variant' => $item->productVariant->name ?? '—',
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