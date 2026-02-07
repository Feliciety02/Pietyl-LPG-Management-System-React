<?php

namespace App\Services\Inventory;

use App\Models\InventoryBalance;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    /**
     * Stock OUT (used by delivery controller)
     * Keep this signature unchanged to avoid breaking DeliveryController.
     */
    public function stockOut(
        int $productVariantId,
        int $locationId,
        int $qty,
        int $userId,
        string $referenceType,
        string $referenceId
    ): void {
        DB::transaction(function () use (
            $productVariantId,
            $locationId,
            $qty,
            $userId,
            $referenceType,
            $referenceId
        ) {
            if ($qty <= 0) {
                return;
            }

            $balance = InventoryBalance::firstOrCreate(
                [
                    'location_id' => $locationId,
                    'product_variant_id' => $productVariantId,
                ],
                [
                    'qty_filled' => 0,
                    'qty_empty' => 0,
                    'qty_reserved' => 0,
                ]
            );

            $available = (int) $balance->qty_filled;
            if ($available < $qty) {
                throw ValidationException::withMessages([
                    'stock' => "Insufficient stock. Available {$available}, requested {$qty}.",
                ]);
            }

            $variant = ProductVariant::with('product')->findOrFail($productVariantId);
            $category = strtolower($variant->product->category ?? '');

            if ($category === 'lpg') {
                $balance->qty_filled = max(0, $balance->qty_filled - $qty);
                $balance->qty_empty = $balance->qty_empty + $qty;
            } else {
                $balance->qty_filled = max(0, $balance->qty_filled - $qty);
            }

            $balance->save();

            StockMovement::create([
                'location_id' => $locationId,
                'product_variant_id' => $productVariantId,
                'movement_type' => 'out',
                'qty' => $qty,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'performed_by_user_id' => $userId,
                'moved_at' => now(),
            ]);
        });
    }

    /**
     * Stock OUT (used by POS, supports refill or swap)
     * This does not affect DeliveryController because it is a new method.
     */
    public function stockOutFromPOS(
        int $productVariantId,
        int $locationId,
        int $qty,
        int $userId,
        string $mode,
        string $referenceType,
        string $referenceId
    ): void {
        DB::transaction(function () use (
            $productVariantId,
            $locationId,
            $qty,
            $userId,
            $mode,
            $referenceType,
            $referenceId
        ) {
            if ($qty <= 0) {
                return;
            }

            $balance = InventoryBalance::firstOrCreate(
                [
                    'location_id' => $locationId,
                    'product_variant_id' => $productVariantId,
                ],
                [
                    'qty_filled' => 0,
                    'qty_empty' => 0,
                    'qty_reserved' => 0,
                ]
            );

            $available = (int) $balance->qty_filled;
            if ($available < $qty) {
                throw ValidationException::withMessages([
                    'stock' => "Insufficient stock. Available {$available}, requested {$qty}.",
                ]);
            }

            $variant = ProductVariant::with('product')->findOrFail($productVariantId);
            $category = strtolower($variant->product->category ?? '');

            $mode = strtolower(trim($mode));

            if ($category === 'lpg') {
                if ($mode === 'swap') {
                    $balance->qty_filled = max(0, $balance->qty_filled - $qty);
                    $balance->qty_empty = $balance->qty_empty + $qty;
                } else {
                    $balance->qty_filled = max(0, $balance->qty_filled - $qty);
                }
            } else {
                $balance->qty_filled = max(0, $balance->qty_filled - $qty);
            }

            $balance->save();

            StockMovement::create([
                'location_id' => $locationId,
                'product_variant_id' => $productVariantId,
                'movement_type' => 'out',
                'qty' => $qty,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'performed_by_user_id' => $userId,
                'moved_at' => now(),
            ]);
        });
    }

    /**
     * Stock IN (purchase delivered)
     */
    public function stockIn(
        int $productVariantId,
        int $locationId,
        int $qty,
        int $userId,
        string $referenceType,
        string $referenceId
    ): void {
        DB::transaction(function () use (
            $productVariantId,
            $locationId,
            $qty,
            $userId,
            $referenceType,
            $referenceId
        ) {
            if ($qty <= 0) {
                return;
            }

            $balance = InventoryBalance::firstOrCreate(
                [
                    'location_id' => $locationId,
                    'product_variant_id' => $productVariantId,
                ],
                [
                    'qty_filled' => 0,
                    'qty_empty' => 0,
                    'qty_reserved' => 0,
                ]
            );

            $balance->qty_filled += $qty;
            $balance->save();

            StockMovement::create([
                'location_id' => $locationId,
                'product_variant_id' => $productVariantId,
                'movement_type' => 'in',
                'qty' => $qty,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'performed_by_user_id' => $userId,
                'moved_at' => now(),
            ]);
        });
    }
}
