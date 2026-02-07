<?php

namespace App\Repositories;

use App\Models\InventoryBalance;
use App\Models\StockMovement;
use App\Models\Location;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class InventoryRepository
{
    public function createStockMovement(array $data): StockMovement
    {
        return StockMovement::create($data);
    }

    public function getInventoryBalance(int $locationId, int $productVariantId): ?InventoryBalance
    {
        return InventoryBalance::where('location_id', $locationId)
            ->where('product_variant_id', $productVariantId)
            ->first();
    }

    public function createInventoryBalance(array $data): InventoryBalance
    {
        return InventoryBalance::create($data);
    }

    public function updateInventoryBalance(InventoryBalance $balance, int $qtyDeducted): void
    {
        $newFilled = max(0, (int) $balance->qty_filled - $qtyDeducted);
        $balance->qty_filled = $newFilled;
        $balance->qty_empty = $balance->qty_empty + $qtyDeducted;
        $balance->save();
    }

    public function getFirstLocation(): ?Location
    {
        return Location::first();
    }

    public function deductStock(int $locationId, int $productVariantId, int $qty): void
    {
        $balance = $this->getInventoryBalance($locationId, $productVariantId);

        if (!$balance) {
            Log::warning('InventoryRepository: Balance not found for deduction', [
                'location_id' => $locationId,
                'product_variant_id' => $productVariantId,
            ]);
            return;
        }

        $balance->qty_filled = max(0, (int) $balance->qty_filled - $qty);
        $balance->save();
    }
}