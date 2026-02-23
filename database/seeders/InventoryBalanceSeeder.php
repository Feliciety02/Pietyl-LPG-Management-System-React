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

        $count = 0;
        $maxRecords = 50;

        foreach ($locations as $location) {
            foreach ($productVariants as $variant) {
                if ($count >= $maxRecords) {
                    break 2;
                }

                $existing = InventoryBalance::firstOrNew([
                    'location_id' => $location->id,
                    'product_variant_id' => $variant->id,
                ]);

                if ((int) $existing->qty_filled === 0) {
                    $existing->qty_filled = rand(10, 100);
                }

                $existing->qty_reserved = 0;
                if ($existing->reorder_level === null || $existing->reorder_level <= 0) {
                    $existing->reorder_level = rand(10, 15);
                }

                $existing->save();

                $count++;
            }
        }
    }
}