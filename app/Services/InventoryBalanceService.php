<?php

namespace App\Services;

use App\Models\InventoryBalance;
use App\Models\ProductVariant;
use App\Repositories\InventoryBalanceRepository;

class InventoryBalanceService
{
    protected InventoryBalanceRepository $repo;

    public function __construct()
    {
        $this->repo = new InventoryBalanceRepository();
    }

    /**
     * Get paginated stock counts for the count page
     */
    public function MapDataForCountPage()
    {
        $perPage = request()->input('per', 10);

        return $this->repo
            ->allWithRelationsPaginated($perPage)
            ->through(function ($balance) {
                return [
                    'id' => $balance->id,
                    'location_id' => $balance->location_id,
                    'location_name' => $balance->location->name ?? null,
                    'sku' => $balance->productVariant->product->sku ?? null,
                    'product_name' => $balance->productVariant->product->name ?? null,
                    'variant' => $balance->productVariant->variant_name ?? null,
                    'filled_qty' => (int)$balance->qty_filled,
                    'empty_qty' => (int)$balance->qty_empty,
                    'total_qty' => (int)$balance->qty_on_hand,
                    'qty_reserved' => (int)$balance->qty_reserved,
                    'qty_available' => $balance->qty_on_hand - $balance->qty_reserved,
                    'reorder_level' => (int)$balance->reorder_level,
                    'last_counted_at' => $balance->updated_at?->format('M d, Y h:i A') ?? null,
                    'updated_by' => 'System',
                ];
            });
    }

   
    public function adjustStock(InventoryBalance $balance, array $validated)
    {
        $this->repo->updateInventory($balance, $validated);

        // TODO: Add stock movement logging here
    }

    public function getLowStock()
    {
        $lowStockItems = $this->repo->allWithRelations()
            ->filter(function ($balance) {
                $available = $balance->qty_on_hand - $balance->qty_reserved;
                return $available <= $balance->reorder_level;
            })
            ->map(function ($balance) {
                $available = $balance->qty_on_hand - $balance->qty_reserved;
                $reorderLevel = $balance->reorder_level;

                $riskLevel = ($available <= $reorderLevel * 0.25) ? 'critical' : 'warning';

                $primarySupplier = $balance->productVariant->suppliers()
                    ->wherePivot('is_primary', true)
                    ->first();

                return [
                    'id' => $balance->id,
                    'location_name' => $balance->location->name ?? null,
                    'sku' => $balance->productVariant->product->sku ?? null,
                    'name' => $balance->productVariant->product->name ?? null,
                    'variant' => $balance->productVariant->variant_name ?? null,
                    'supplier_name' => $primarySupplier?->name ?? '—',
                    'current_qty' => $available,
                    'reorder_level' => $reorderLevel,
                    'est_days_left' => rand(1, 5),
                    'risk_level' => $riskLevel,
                    'last_movement_at' => $balance->updated_at?->format('M d, Y h:i A'),
                    'purchase_request_id' => null,
                    'purchase_request_status' => null,
                    'requested_by_name' => null,
                    'requested_at' => null,
                ];
            });

        // Build product hash
        $allVariants = ProductVariant::with(['product', 'suppliers'])->get();
        $productHash = [];
        foreach ($allVariants as $variant) {
            $key = $variant->product->name . '|' . $variant->variant_name;

            $primarySupplier = $variant->suppliers()->wherePivot('is_primary', true)->first();

            if (!isset($productHash[$key])) {
                $productHash[$key] = [
                    'id' => $variant->id,
                    'sku' => $variant->product->sku,
                    'name' => $variant->product->name,
                    'variant' => $variant->variant_name,
                    'default_supplier_id' => $primarySupplier?->id,
                    'supplier_ids' => $variant->suppliers->pluck('id')->toArray(),
                ];
            } else {
                $productHash[$key]['supplier_ids'] = array_unique(array_merge(
                    $productHash[$key]['supplier_ids'],
                    $variant->suppliers->pluck('id')->toArray()
                ));
            }
        }

        return [
            'low_stock' => $lowStockItems->values(),
            'product_hash' => array_values($productHash),
            'suppliers' => \App\Models\Supplier::where('is_active', true)->get(['id', 'name']),
        ];
    }
}
