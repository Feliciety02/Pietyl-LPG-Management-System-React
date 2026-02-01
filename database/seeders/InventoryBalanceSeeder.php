<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryBalance;
use App\Models\Location;
use App\Models\ProductVariant;

class InventoryBalanceSeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::all();
        if ($locations->isEmpty()) {
            $locations = collect([
                Location::create([
                    'name' => 'Main Warehouse',
                    'location_type' => 'warehouse',
                    'is_active' => true,
                ]),
            ]);
        }
        $productVariants = ProductVariant::all();

        if ($locations->isEmpty() || $productVariants->isEmpty()) {
            return;
        }

        foreach ($locations as $location) {
            foreach ($productVariants as $variant) {
                $totalQty = rand(10, 100);
                $filledQty = rand(5, $totalQty);
                $emptyQty = $totalQty - $filledQty;

                $existing = InventoryBalance::firstOrNew([
                    'location_id' => $location->id,
                    'product_variant_id' => $variant->id,
                ]);

                $currentTotal = (int) $existing->qty_filled + (int) $existing->qty_empty;
                if ($currentTotal === 0) {
                    $existing->qty_filled = $filledQty;
                    $existing->qty_empty = $emptyQty;
                }

                $existing->qty_reserved = $existing->qty_reserved ?? rand(0, 10);
                $existing->reorder_level = $existing->reorder_level ?? rand(10, 30);
                $existing->save();
            }
        }
    }
}
