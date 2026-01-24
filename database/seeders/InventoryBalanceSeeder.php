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
        $productVariants = ProductVariant::all();

        if ($locations->isEmpty() || $productVariants->isEmpty()) {
            throw new \Exception('Need locations and product variants before running this seeder');
        }

        foreach ($locations as $location) {
            // Add inventory for random 50-80% of product variants at each location
            $numVariants = rand(
                (int)($productVariants->count() * 0.5),
                (int)($productVariants->count() * 0.8)
            );
            
            $selectedVariants = $productVariants->random($numVariants);

            foreach ($selectedVariants as $variant) {
                $totalQty = rand(10, 100);
                $filledQty = rand(5, $totalQty);
                $emptyQty = $totalQty - $filledQty;
                
                InventoryBalance::create([
                    'location_id' => $location->id,
                    'product_variant_id' => $variant->id,
                    'qty_filled' => $filledQty,
                    'qty_empty' => $emptyQty,
                    'qty_reserved' => rand(0, 10),
                    'reorder_level' => rand(10, 30),
                ]);
            }
        }
    }
}