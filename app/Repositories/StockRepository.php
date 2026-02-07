<?php

namespace App\Repositories;

use App\Models\InventoryBalance;
use App\Models\StockMovement;
use App\Models\StockCount;
use App\Models\ProductVariant;
use App\Models\Location;
use Illuminate\Support\Facades\DB;

class StockRepository
{
    public function getInventoryBalances(int $locationId, ?string $search, int $perPage)
    {
        $query = InventoryBalance::with(['productVariant.product', 'location'])
            ->where('location_id', $locationId);

        if ($search) {
            $query->where(function ($sub) use ($search) {
                $sub->whereHas('productVariant.product', function ($p) use ($search) {
                    $p->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
                })->orWhereHas('productVariant', function ($p) use ($search) {
                    $p->where('variant_name', 'like', "%{$search}%");
                });
            });
        }

        return $query->paginate($perPage);
    }

    public function getExistingVariantIds(int $locationId)
    {
        return InventoryBalance::where('location_id', $locationId)
            ->pluck('product_variant_id')
            ->all();
    }

    public function getMissingVariants(array $existingIds)
    {
        return ProductVariant::whereNotIn('id', $existingIds)->get();
    }

    public function createInventoryBalance(array $data)
    {
        return InventoryBalance::create($data);
    }

    public function getLatestStockCounts()
    {
        return StockCount::select('stock_counts.*')
            ->join(DB::raw('(SELECT inventory_balance_id, MAX(id) as max_id FROM stock_counts GROUP BY inventory_balance_id) as latest'), function ($join) {
                $join->on('latest.inventory_balance_id', '=', 'stock_counts.inventory_balance_id');
                $join->on('latest.max_id', '=', 'stock_counts.id');
            })
            ->get()
            ->keyBy('inventory_balance_id');
    }

    public function getMovementsByCountIds($countIds)
    {
        if ($countIds->isEmpty()) {
            return collect();
        }

        return StockMovement::where('reference_type', StockCount::class)
            ->whereIn('reference_id', $countIds)
            ->orderByDesc('id')
            ->get()
            ->unique('reference_id')
            ->keyBy('reference_id');
    }

    public function getLatestStockCountForBalance(int $inventoryBalanceId)
    {
        return StockCount::where('inventory_balance_id', $inventoryBalanceId)
            ->orderByDesc('id')
            ->first();
    }

    public function createStockCount(array $data)
    {
        return StockCount::create($data);
    }

    public function updateStockCount(StockCount $stockCount, array $data)
    {
        return $stockCount->update($data);
    }

    public function updateInventoryBalance(InventoryBalance $balance, array $data)
    {
        return $balance->update($data);
    }

    public function createStockMovement(array $data)
    {
        return StockMovement::create($data);
    }

    public function getStockMovements(?string $search, ?string $type, ?string $direction, int $perPage)
    {
        $query = StockMovement::with([
            'productVariant.product',
            'performedBy',
            'location'
        ]);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->whereHas('productVariant.product', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
                });
            });
        }

        if ($type && $type !== 'all') {
            $query->where('movement_type', $type);
        }

        if ($direction === 'in') {
            $query->where('qty', '>', 0);
        } elseif ($direction === 'out') {
            $query->where('qty', '<', 0);
        }

        return $query->orderBy('moved_at', 'desc')->paginate($perPage);
    }

    public function findInventoryBalanceById(int $id)
    {
        return InventoryBalance::find($id);
    }

    public function getFirstLocation()
    {
        return Location::first();
    }
}