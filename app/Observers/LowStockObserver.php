<?php

namespace App\Observers;

use App\Models\InventoryBalance;
use App\Services\Inventory\NotificationService;
use App\Models\User;

class LowStockObserver
{
    private NotificationService $notificationService;

    public function __construct()
    {
        $this->notificationService = new NotificationService();
    }

    public function updated(InventoryBalance $inventoryBalance): void
    {
        // Check if stock fell below threshold
        $currentQty = $inventoryBalance->qty_filled;
        $threshold = $inventoryBalance->reorder_level;

        if ($currentQty <= $threshold && $currentQty > 0) {
            $this->notifyLowStock($inventoryBalance);
        }
    }

    public function created(InventoryBalance $inventoryBalance): void
    {
        $currentQty = $inventoryBalance->qty_filled;
        $threshold = $inventoryBalance->reorder_level;

        if ($currentQty <= $threshold && $currentQty > 0) {
            $this->notifyLowStock($inventoryBalance);
        }
    }

    private function notifyLowStock(InventoryBalance $inventoryBalance): void
    {
        try {
            // Get product name
            $productName = $inventoryBalance->productVariant?->variant_name
                ?? $inventoryBalance->productVariant?->product?->name
                ?? 'Unknown Product';

            // Get all admins and inventory managers
            $adminIds = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['admin', 'inventory_manager']);
            })->pluck('id')->toArray();

            if (!empty($adminIds)) {
                $currentQty = (int) $inventoryBalance->qty_filled;
                $threshold = (int) $inventoryBalance->reorder_level;

                $this->notificationService->notifyLowStock(
                    $inventoryBalance->product_variant_id,
                    $productName,
                    $currentQty,
                    $threshold,
                    $adminIds
                );
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to create low stock notification: ' . $e->getMessage());
        }
    }
}
