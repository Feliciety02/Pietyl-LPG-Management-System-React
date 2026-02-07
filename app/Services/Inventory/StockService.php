<?php

namespace App\Services\Inventory;

use App\Models\InventoryBalance;
use App\Models\StockCount;
use App\Models\StockMovement;
use App\Repositories\StockRepository;
use Carbon\Carbon;

class StockService
{
    public function __construct(
        private StockRepository $stockRepository
    ) {}

    public function getStockCountsForIndex(int $locationId, ?string $search, ?string $status, int $perPage)
    {
        // Ensure all variants have balances
        $this->ensureAllVariantsHaveBalances($locationId);

        $balances = $this->stockRepository->getInventoryBalances($locationId, $search, $perPage);
        $latestCounts = $this->stockRepository->getLatestStockCounts();
        
        $latestCountIds = $latestCounts->pluck('id')->filter()->values();
        $movementByCountId = $this->stockRepository->getMovementsByCountIds($latestCountIds);

        $items = $balances->getCollection()->map(function ($balance) use ($latestCounts, $status, $movementByCountId) {
            return $this->transformStockCountItem($balance, $latestCounts, $status, $movementByCountId);
        })->filter()->values();

        return [
            'data' => $items,
            'meta' => [
                'current_page' => $balances->currentPage(),
                'last_page' => $balances->lastPage(),
                'from' => $balances->firstItem(),
                'to' => $balances->lastItem(),
                'total' => $balances->total(),
            ],
        ];
    }

    public function getFirstLocation()
    {
        return $this->stockRepository->getFirstLocation();
    }

    public function submitStockCount(InventoryBalance $inventoryBalance, array $validated, $user)
    {
        $latest = $this->stockRepository->getLatestStockCountForBalance($inventoryBalance->id);

        if ($latest && $latest->status === 'submitted') {
            throw new \Exception('A count is already pending review for this item.');
        }

        $systemFilled = (int) $inventoryBalance->qty_filled;
        $systemEmpty = (int) $inventoryBalance->qty_empty;
        $countedFilled = (int) $validated['filled_qty'];
        $countedEmpty = (int) $validated['empty_qty'];

        return $this->stockRepository->createStockCount([
            'inventory_balance_id' => $inventoryBalance->id,
            'product_variant_id' => $inventoryBalance->product_variant_id,
            'location_id' => $inventoryBalance->location_id,
            'system_filled' => $systemFilled,
            'system_empty' => $systemEmpty,
            'counted_filled' => $countedFilled,
            'counted_empty' => $countedEmpty,
            'variance_filled' => $countedFilled - $systemFilled,
            'variance_empty' => $countedEmpty - $systemEmpty,
            'status' => 'submitted',
            'note' => $validated['reason'],
            'created_by_user_id' => $user->id,
            'submitted_at' => now(),
        ]);
    }

    public function reviewStockCount(StockCount $stockCount, array $validated, $user)
    {
        if ($stockCount->status !== 'submitted') {
            throw new \Exception('This count is already reviewed.');
        }

        $approved = $validated['action'] === 'approve';
        $movementId = null;

        if ($approved) {
            $this->stockRepository->updateStockCount($stockCount, [
                'status' => 'approved',
                'reviewed_by_user_id' => $user->id,
                'reviewed_at' => now(),
                'review_note' => $validated['note'] ?? null,
            ]);

            $balance = $this->stockRepository->findInventoryBalanceById($stockCount->inventory_balance_id);
            
            if ($balance) {
                $movementId = $this->applyStockCountAdjustment($stockCount, $balance, $user);
            }
        } else {
            $this->stockRepository->updateStockCount($stockCount, [
                'status' => 'rejected',
                'reviewed_by_user_id' => $user->id,
                'reviewed_at' => now(),
                'review_note' => $validated['note'] ?? null,
                'counted_filled' => 0,
                'counted_empty' => 0,
                'variance_filled' => 0,
                'variance_empty' => 0,
                'submitted_at' => null,
            ]);
        }

        return $movementId;
    }

    public function getStockMovementsForIndex(?string $search, ?string $type, ?string $direction, int $perPage)
    {
        $movements = $this->stockRepository->getStockMovements($search, $type, $direction, $perPage);

        $data = $movements->through(function ($movement) {
            return $this->transformMovement($movement);
        });

        return [
            'data' => $data->items(),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'from' => $data->firstItem(),
                'to' => $data->lastItem(),
                'total' => $data->total(),
            ],
        ];
    }

    private function ensureAllVariantsHaveBalances(int $locationId)
    {
        $existingVariantIds = $this->stockRepository->getExistingVariantIds($locationId);
        $missingVariants = $this->stockRepository->getMissingVariants($existingVariantIds);
        
        foreach ($missingVariants as $variant) {
            $this->stockRepository->createInventoryBalance([
                'location_id' => $locationId,
                'product_variant_id' => $variant->id,
                'qty_filled' => 0,
                'qty_empty' => 0,
                'qty_reserved' => 0,
                'reorder_level' => 0,
            ]);
        }
    }

    private function transformStockCountItem($balance, $latestCounts, $status, $movementByCountId)
    {
        $latest = $latestCounts->get($balance->id);
        $latestStatus = $latest?->status ?? null;
        
        if ($status !== 'all' && $latestStatus !== $status) {
            return null;
        }

        $systemFilled = (int) $balance->qty_filled;
        $systemEmpty = (int) $balance->qty_empty;
        $systemTotal = $systemFilled + $systemEmpty;

        $countedFilled = (int) ($latest?->counted_filled ?? 0);
        $countedEmpty = (int) ($latest?->counted_empty ?? 0);
        $countedTotal = $countedFilled + $countedEmpty;
        $varianceTotal = $countedTotal - $systemTotal;
        $submittedBy = $latest?->createdBy?->name;
        $submittedAt = $latest?->submitted_at?->format('M d, Y h:i A');

        if ($latestStatus === 'rejected' || !$latestStatus) {
            $countedFilled = 0;
            $countedEmpty = 0;
            $countedTotal = 0;
            $varianceTotal = 0;
            $submittedBy = null;
            $submittedAt = null;
        }

        $movement = $latest?->id ? $movementByCountId->get($latest->id) : null;

        return [
            'id' => $balance->id,
            'inventory_balance_id' => $balance->id,
            'product_variant_id' => $balance->product_variant_id,
            'location_name' => $balance->location?->name,
            'sku' => $balance->productVariant->product->sku ?? null,
            'product_name' => $balance->productVariant->product->name ?? null,
            'variant' => $balance->productVariant->variant_name ?? null,
            'filled_qty' => $systemFilled,
            'empty_qty' => $systemEmpty,
            'total_qty' => $systemTotal,
            'last_counted_at' => $latest?->submitted_at?->format('M d, Y h:i A') ?? $balance->updated_at?->format('M d, Y h:i A'),
            'updated_by' => $latest?->createdBy?->name ?? 'System',
            'latest_count_id' => $latest?->id,
            'latest_status' => $latestStatus,
            'submitted_by' => $submittedBy,
            'submitted_at' => $submittedAt,
            'reviewed_by' => $latest?->reviewedBy?->name,
            'reviewed_at' => $latest?->reviewed_at?->format('M d, Y h:i A'),
            'system_filled' => $systemFilled,
            'system_empty' => $systemEmpty,
            'system_qty' => $systemTotal,
            'counted_filled' => $countedFilled,
            'counted_empty' => $countedEmpty,
            'counted_qty' => $countedTotal,
            'variance_qty' => $varianceTotal,
            'latest_movement_id' => $movement?->id,
        ];
    }

    private function applyStockCountAdjustment(StockCount $stockCount, InventoryBalance $balance, $user)
    {
        $beforeTotal = (int) $balance->qty_filled + (int) $balance->qty_empty;
        $afterTotal = (int) $stockCount->counted_filled + (int) $stockCount->counted_empty;
        $delta = $afterTotal - $beforeTotal;

        $this->stockRepository->updateInventoryBalance($balance, [
            'qty_filled' => $stockCount->counted_filled,
            'qty_empty' => $stockCount->counted_empty,
        ]);

        $movement = $this->stockRepository->createStockMovement([
            'location_id' => $balance->location_id,
            'product_variant_id' => $balance->product_variant_id,
            'movement_type' => StockMovement::TYPE_ADJUSTMENT,
            'qty' => $delta,
            'reference_type' => StockCount::class,
            'reference_id' => $stockCount->id,
            'performed_by_user_id' => $user->id,
            'moved_at' => Carbon::now(),
            'notes' => 'Stock count adjustment',
        ]);

        return $movement->id;
    }

    private function transformMovement($movement)
    {
        $type = match($movement->movement_type) {
            'purchase_in' => 'purchase',
            'sale_out' => 'sale',
            'adjustment' => 'adjustment',
            'damage' => 'damage',
            'transfer_in' => 'transfer',
            'transfer_out' => 'transfer',
            default => $movement->movement_type,
        };

        return [
            'id' => $movement->id,
            'product_name' => $movement->productVariant->product->name ?? 'Unknown',
            'variant' => $movement->productVariant->variant_name ?? null,
            'sku' => $movement->productVariant->product->sku ?? null,
            'qty' => abs($movement->qty),
            'direction' => $movement->qty > 0 ? 'in' : 'out',
            'type' => $type,
            'movement_type' => $movement->movement_type,
            'actor_name' => $movement->performedBy->name ?? 'System',
            'occurred_at' => $movement->moved_at->format('M d, Y h:i A'),
            'reference_type' => $movement->reference_type,
            'reference_id' => $movement->reference_id,
            'notes' => $movement->notes,
        ];
    }
}