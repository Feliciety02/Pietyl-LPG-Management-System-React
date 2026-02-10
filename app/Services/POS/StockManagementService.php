<?php

namespace App\Services\POS;

use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\User;
use App\Repositories\InventoryRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class StockManagementService
{
    public function __construct(
        private InventoryRepository $inventoryRepository
    ) {}

    public function processStockMovement(Sale $sale, array $line, User $user): void
    {
        $location = $this->inventoryRepository->getFirstLocation();

        if (!$location) {
            Log::warning('StockManagementService: no location found, skipping stock movement', [
                'sale_id' => $sale->id,
                'product_variant_id' => $line['product_id'],
            ]);
            return;
        }

        $qty = (float) $line['qty'];

        // Create stock movement record
        $this->inventoryRepository->createStockMovement([
            'location_id' => $location->id,
            'product_variant_id' => $line['product_id'],
            'movement_type' => StockMovement::TYPE_SALE_OUT,
            'qty' => -$qty,
            'reference_type' => Sale::class,
            'reference_id' => $sale->id,
            'performed_by_user_id' => $user->id,
            'moved_at' => Carbon::now(),
            'notes' => 'Sale via POS',
        ]);

        // Update inventory balance
        $this->updateInventoryBalance($location->id, $line['product_id'], (int) $qty);
    }

    private function updateInventoryBalance(int $locationId, int $productVariantId, int $qty): void
    {
        $balance = $this->inventoryRepository->getInventoryBalance($locationId, $productVariantId);

        if (!$balance) {
            Log::warning('StockManagementService: InventoryBalance missing, creating placeholder record', [
                'location_id' => $locationId,
                'product_variant_id' => $productVariantId,
            ]);

            $balance = $this->inventoryRepository->createInventoryBalance([
                'location_id' => $locationId,
                'product_variant_id' => $productVariantId,
                'qty_filled' => 0,
                'qty_reserved' => 0,
            ]);
        }

        $this->inventoryRepository->updateInventoryBalance($balance, $qty);
    }
}
