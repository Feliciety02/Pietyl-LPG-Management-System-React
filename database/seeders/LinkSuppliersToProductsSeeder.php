<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LinkSuppliersToProductsSeeder extends Seeder
{
    public function run(): void
    {
        // Get all suppliers
        $suppliers = DB::table('suppliers')->get();
        
        if ($suppliers->isEmpty()) {
            $this->command->error('❌ No suppliers found! Create suppliers first.');
            return;
        }

        // Get all product variants
        $variants = DB::table('product_variants')->get();
        
        if ($variants->isEmpty()) {
            $this->command->error('❌ No product variants found!');
            return;
        }

        $this->command->info("Linking {$variants->count()} variants to {$suppliers->count()} suppliers randomly...");

        // Clear existing links
        DB::table('supplier_products')->truncate();

        $linked = 0;
        $supplierIds = $suppliers->pluck('id')->toArray();

        foreach ($variants as $variant) {
            // Pick a random supplier
            $randomSupplierId = $supplierIds[array_rand($supplierIds)];
            
            // Link variant to random supplier
            DB::table('supplier_products')->insert([
                'supplier_id' => $randomSupplierId,
                'product_variant_id' => $variant->id,
                'supplier_sku' => 'SKU-' . $variant->id,
                'supplier_cost' => rand(500, 5000), // Random cost between 500-5000
                'lead_time_days' => rand(3, 14), // Random lead time 3-14 days
                'is_primary' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $linked++;
        }

        
        // Show distribution
        $distribution = DB::table('supplier_products')
            ->join('suppliers', 'supplier_products.supplier_id', '=', 'suppliers.id')
            ->select('suppliers.name', DB::raw('COUNT(*) as count'))
            ->groupBy('suppliers.id', 'suppliers.name')
            ->get();

    }
}