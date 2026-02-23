<?php

namespace Database\Seeders;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class SaleItemSeeder extends Seeder
{
    public function run(): void
    {
        $sales = Sale::all();

        if ($sales->isEmpty()) {
            $this->command->warn('No sales found. Run SaleSeeder first.');
            return;
        }

        $variants = ProductVariant::with('product')->get();

        if ($variants->isEmpty()) {
            $this->command->warn('No product variants found.');
            return;
        }

        // Collect variants by size
        $variant11kg = $variants->where('size_value', 11.0)->first();
        $variant22kg = $variants->where('size_value', 22.0)->first();
        $variant50kg = $variants->where('size_value', 50.0)->first();
        $variant27kg = $variants->where('size_value', 2.7)->first();
        $variant5kg  = $variants->where('size_value', 5.0)->first();
        $variantStd  = $variants->where('size_value', null)->first(); // stoves/accessories

        if (!$variant11kg || !$variant22kg || !$variant50kg) {
            $this->command->warn('Required product variants (11kg, 22kg, 50kg) not found.');
            return;
        }

        $price11kg = $variant11kg->product?->price ?? 1000.00;
        $price22kg = $variant22kg->product?->price ?? 2000.00;
        $price50kg = $variant50kg->product?->price ?? 4200.00;
        $price27kg = $variant27kg?->product?->price ?? 400.00;
        $price5kg  = $variant5kg?->product?->price  ?? 600.00;
        $priceStd  = $variantStd?->product?->price  ?? 3200.00;

        $products = [
            '11kg' => ['variant' => $variant11kg, 'price' => $price11kg],
            '22kg' => ['variant' => $variant22kg, 'price' => $price22kg],
            '50kg' => ['variant' => $variant50kg, 'price' => $price50kg],
            '2.7kg'=> ['variant' => $variant27kg ?? $variant11kg, 'price' => $price27kg],
            '5kg'  => ['variant' => $variant5kg  ?? $variant11kg, 'price' => $price5kg],
            'std'  => ['variant' => $variantStd  ?? $variant11kg, 'price' => $priceStd],
        ];

        $createdCount = 0;

        foreach ($sales as $sale) {
            if (SaleItem::where('sale_id', $sale->id)->exists()) {
                continue;
            }

            $items = $this->generateItems($sale->grand_total, $products);

            foreach ($items as $item) {
                $lineTotal = $item['qty'] * $item['price'];

                SaleItem::create([
                    'sale_id'            => $sale->id,
                    'product_variant_id' => $item['variant']->id,
                    'qty'                => $item['qty'],
                    'unit_price'         => $item['price'],
                    'line_total'         => $lineTotal,
                    'line_net_amount'    => $lineTotal,
                    'line_vat_amount'    => 0,
                    'line_gross_amount'  => $lineTotal,
                    'pricing_source'     => 'manual',
                ]);

                $createdCount++;
            }
        }

        $this->command->info("SaleItemSeeder: created {$createdCount} sale items for {$sales->count()} sales.");
    }

    private function generateItems(float $total, array $p): array
    {
        // Map of common totals → item combinations (50 distinct combinations)
        $map = [
            // 1x 11kg
            950.00   => [['variant' => $p['11kg']['variant'], 'price' => $p['11kg']['price'], 'qty' => 1]],
            1000.00  => [['variant' => $p['11kg']['variant'], 'price' => $p['11kg']['price'], 'qty' => 1]],
            1135.00  => [['variant' => $p['11kg']['variant'], 'price' => $p['11kg']['price'], 'qty' => 1]],

            // 1x 22kg
            1750.00  => [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 1]],
            2000.00  => [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 1]],

            // 2x 11kg
            1900.00  => [['variant' => $p['11kg']['variant'], 'price' => $p['11kg']['price'], 'qty' => 2]],
            2000.00  => [['variant' => $p['11kg']['variant'], 'price' => $p['11kg']['price'], 'qty' => 2]],

            // 2x 22kg / 1x 50kg
            3500.00  => rand(0,1)
                ? [['variant' => $p['50kg']['variant'], 'price' => $p['50kg']['price'], 'qty' => 1]]
                : [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 2]],
            4000.00  => [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 2]],
            4200.00  => [['variant' => $p['50kg']['variant'], 'price' => $p['50kg']['price'], 'qty' => 1]],

            // 3x 22kg
            5250.00  => [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 3]],
            6000.00  => [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 3]],

            // 4x 22kg / 2x 50kg
            7000.00  => rand(0,1)
                ? [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 4]]
                : [['variant' => $p['50kg']['variant'], 'price' => $p['50kg']['price'], 'qty' => 2]],
            8000.00  => [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 4]],
            8400.00  => [['variant' => $p['50kg']['variant'], 'price' => $p['50kg']['price'], 'qty' => 2]],

            // 6x 22kg / 3x 50kg
            10500.00 => rand(0,1)
                ? [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 6]]
                : [['variant' => $p['50kg']['variant'], 'price' => $p['50kg']['price'], 'qty' => 3]],
            12000.00 => [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 6]],
            12600.00 => [['variant' => $p['50kg']['variant'], 'price' => $p['50kg']['price'], 'qty' => 3]],

            // 9x 22kg (bulk corporate)
            15750.00 => [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 9]],
            18000.00 => [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 9]],

            // 12x 22kg / mixed hotel order
            20500.00 => [
                ['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 10],
                ['variant' => $p['11kg']['variant'], 'price' => $p['11kg']['price'], 'qty' => 1],
            ],
            21000.00 => [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 12]],

            // 4x 50kg (industrial)
            14000.00 => [['variant' => $p['50kg']['variant'], 'price' => $p['50kg']['price'], 'qty' => 4]],
            16800.00 => [['variant' => $p['50kg']['variant'], 'price' => $p['50kg']['price'], 'qty' => 4]],

            // Mixed: 22kg + 11kg
            2750.00  => [
                ['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 1],
                ['variant' => $p['11kg']['variant'], 'price' => $p['11kg']['price'], 'qty' => 1],
            ],
            3000.00  => [
                ['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => 1],
                ['variant' => $p['11kg']['variant'], 'price' => $p['11kg']['price'], 'qty' => 1],
            ],
        ];

        if (isset($map[$total])) {
            return $map[$total];
        }

        // Default fallback: approximate with 22kg units
        $qty = max(1, (int) round($total / $p['22kg']['price']));
        return [['variant' => $p['22kg']['variant'], 'price' => $p['22kg']['price'], 'qty' => $qty]];
    }
}