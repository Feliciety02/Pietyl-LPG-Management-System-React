<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Stock;
use App\Models\Supplier;
use App\Models\Product;
use Illuminate\Support\Str;

class StockSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::all();
        $suppliers = Supplier::all();

        foreach ($products as $product) {
            $filled = rand(5, 30);
            $empty = rand(0, 15);

            Stock::create([
                'product_id' => $product->id,
                'supplier_id' => $suppliers->random()->id,
                'filled_qty' => $filled,
                'restock_at' => rand(5, 20), 
                'empty_qty' => $empty,
                'last_counted_at' => now()->subDays(rand(0, 5))->subHours(rand(0, 12)),
                'updated_by' => 'Inventory Manager',
                'reason' => 'Initial stock load',
            ]);
        }
    }
}
