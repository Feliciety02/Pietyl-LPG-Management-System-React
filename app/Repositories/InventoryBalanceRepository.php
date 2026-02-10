<?php

namespace App\Repositories;

use App\Models\InventoryBalance;
use App\Models\ProductVariant;
use App\Repositories\Interfaces\InventoryBalanceRepositoryInterface;

class InventoryBalanceRepository implements InventoryBalanceRepositoryInterface
{
    public function allWithRelations()
    {
        return InventoryBalance::with(['productVariant.product', 'location'])->get();
    }

    public function find(int $id)
    {
        return InventoryBalance::find($id);
    }

    public function lowStock()
    {
        return InventoryBalance::whereRaw('qty_filled <= reorder_level')
            ->with(['productVariant.product', 'location'])
            ->get();
    }

    public function allProductVariantsWithSuppliers()
    {
        return ProductVariant::with('suppliers')->get();
    }

    public function allWithRelationsPaginated($perPage = 10)
    {
        return InventoryBalance::with(['productVariant.product', 'location'])
            ->paginate($perPage);
    }

    public function updateInventory(InventoryBalance $balance, array $data) {
        $balance->qty_filled = $data['filled_qty'];
        $balance->reorder_level = $data['reorder_level'] ?? $balance->reorder_level;
        $balance->save();

    }
}
