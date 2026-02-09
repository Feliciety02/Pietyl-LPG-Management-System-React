<?php

namespace App\Services\Inventory;

use App\Models\InventoryBalance;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\ProductVariant;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AutoPurchaseRequestService
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    /**
     * Scan for low stock items and automatically create purchase requests
     * Returns array of created purchase request IDs
     */
    public function generatePurchaseRequestsForLowStock(?int $adminUserId = null): array
    {
        $createdPRIds = [];

        // Find all low stock items
        $lowStockItems = $this->getLowStockItems();

        if ($lowStockItems->isEmpty()) {
            return $createdPRIds;
        }

        // Group by supplier
        $itemsBySupplier = $lowStockItems->groupBy('supplier_id');

        foreach ($itemsBySupplier as $supplierId => $items) {
            try {
                $prId = $this->createPurchaseRequestForSupplier($supplierId, $items, $adminUserId);
                if ($prId) {
                    $createdPRIds[] = $prId;
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error(
                    "Failed to create purchase request for supplier {$supplierId}: " . $e->getMessage()
                );
            }
        }

        return $createdPRIds;
    }

    /**
     * Get all items below reorder level
     */
    private function getLowStockItems()
    {
        return DB::table('inventory_balances as ib')
            ->join('product_variants as pv', 'pv.id', '=', 'ib.product_variant_id')
            ->join('products as p', 'p.id', '=', 'pv.product_id')
            ->join('suppliers as s', 's.id', '=', 'p.supplier_id')
            ->select(
                'ib.id as balance_id',
                'ib.product_variant_id',
                'ib.location_id',
                'ib.qty_filled',
                'ib.qty_empty',
                'ib.reorder_level',
                'p.id as product_id',
                'p.name as product_name',
                'p.supplier_cost',
                'pv.variant_name',
                's.id as supplier_id',
                's.name as supplier_name'
            )
            ->whereRaw('(ib.qty_filled + ib.qty_empty) <= ib.reorder_level')
            ->get();
    }

    /**
     * Create a purchase request for a supplier with multiple items
     */
    private function createPurchaseRequestForSupplier(int $supplierId, $items, ?int $adminUserId = null): ?int
    {
        // Check if supplier has an active purchase request
        $existingPR = PurchaseRequest::where('supplier_id', $supplierId)
            ->whereIn('status', ['draft', 'pending', 'approved'])
            ->first();

        if ($existingPR) {
            // Add items to existing PR
            foreach ($items as $item) {
                $this->addItemToPurchaseRequest($existingPR, $item);
            }
            return $existingPR->id;
        }

        // Create new purchase request
        return DB::transaction(function () use ($supplierId, $items, $adminUserId) {
            $prNumber = $this->generatePurchaseRequestNumber();

            $pr = PurchaseRequest::create([
                'pr_number' => $prNumber,
                'supplier_id' => $supplierId,
                'status' => 'draft',
                'auto_generated' => true,
                'created_by_user_id' => $adminUserId ?? User::where('roles', 'admin')->first()?->id ?? 1,
                'notes' => 'Auto-generated from low stock detection',
            ]);

            $total = 0;
            foreach ($items as $item) {
                $suggestedQty = $this->calculateSuggestedQuantity($item);
                $cost = (float) $item->supplier_cost * $suggestedQty;
                $total += $cost;

                PurchaseRequestItem::create([
                    'purchase_request_id' => $pr->id,
                    'product_variant_id' => $item->product_variant_id,
                    'qty' => $suggestedQty,
                    'unit_cost' => (float) $item->supplier_cost,
                    'line_total' => $cost,
                ]);
            }

            $pr->update(['total_amount' => $total]);

            \Illuminate\Support\Facades\Log::info("Created purchase request {$pr->pr_number} with " . count($items) . " items");

            return $pr->id;
        });
    }

    /**
     * Add an item to an existing purchase request
     */
    private function addItemToPurchaseRequest($purchaseRequest, $item): void
    {
        // Check if item already exists in PR
        $existingItem = PurchaseRequestItem::where('purchase_request_id', $purchaseRequest->id)
            ->where('product_variant_id', $item->product_variant_id)
            ->first();

        if ($existingItem) {
            // Update quantity if we find it later
            $suggestedQty = $this->calculateSuggestedQuantity($item);
            $cost = (float) $item->supplier_cost * $suggestedQty;

            $existingItem->update([
                'qty' => $suggestedQty,
                'line_total' => $cost,
            ]);
        } else {
            // Add new item
            $suggestedQty = $this->calculateSuggestedQuantity($item);
            $cost = (float) $item->supplier_cost * $suggestedQty;

            PurchaseRequestItem::create([
                'purchase_request_id' => $purchaseRequest->id,
                'product_variant_id' => $item->product_variant_id,
                'qty' => $suggestedQty,
                'unit_cost' => (float) $item->supplier_cost,
                'line_total' => $cost,
            ]);
        }

        // Recalculate PR total
        $total = $purchaseRequest->items()->sum('line_total');
        $purchaseRequest->update(['total_amount' => $total]);
    }

    /**
     * Calculate suggested quantity to order
     * Can be: reorder level, reorder level * 2, or custom logic
     */
    private function calculateSuggestedQuantity($item): int
    {
        $current = (int) ($item->qty_filled + $item->qty_empty);
        $threshold = (int) $item->reorder_level;

        // Order enough to reach 2x the reorder level
        $suggested = max($threshold * 2 - $current, $threshold);

        // Minimum order quantity
        return max($suggested, 10);
    }

    /**
     * Generate unique PR number
     */
    private function generatePurchaseRequestNumber(): string
    {
        $today = now()->format('Ymd');
        $count = PurchaseRequest::whereDate('created_at', now())->count() + 1;

        return "PR-{$today}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get suggestions for what should be ordered
     */
    public function getSuggestions(?int $locationId = null): array
    {
        $items = $this->getLowStockItems();

        return $items->map(function ($item) {
            return [
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'variant_name' => $item->variant_name,
                'supplier_id' => $item->supplier_id,
                'supplier_name' => $item->supplier_name,
                'current_qty' => (int) ($item->qty_filled + $item->qty_empty),
                'reorder_level' => (int) $item->reorder_level,
                'suggested_qty' => $this->calculateSuggestedQuantity($item),
                'unit_cost' => (float) $item->supplier_cost,
            ];
        })->toArray();
    }
}
