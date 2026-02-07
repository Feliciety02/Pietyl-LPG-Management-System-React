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

        // Get specific variants
        $variant11kg = $variants->where('size_value', 11.0)->first();
        $variant22kg = $variants->where('size_value', 22.0)->first();
        $variant50kg = $variants->where('size_value', 50.0)->first();

        if (!$variant11kg || !$variant22kg || !$variant50kg) {
            $this->command->warn('Required product variants (11kg, 22kg, 50kg) not found.');
            return;
        }

        $price11kg = $variant11kg->product?->price ?? 950.00;
        $price22kg = $variant22kg->product?->price ?? 1750.00;
        $price50kg = $variant50kg->product?->price ?? 3500.00;

        $createdCount = 0;

        foreach ($sales as $sale) {
            // Skip if sale items already exist
            if (SaleItem::where('sale_id', $sale->id)->exists()) {
                continue;
            }

            // Determine what to sell based on sale total
            $items = $this->generateItemsForSaleTotal($sale->grand_total, [
                '11kg' => ['variant' => $variant11kg, 'price' => $price11kg],
                '22kg' => ['variant' => $variant22kg, 'price' => $price22kg],
                '50kg' => ['variant' => $variant50kg, 'price' => $price50kg],
            ]);

            foreach ($items as $item) {
                $lineTotal = $item['qty'] * $item['price'];
                
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_variant_id' => $item['variant']->id,
                    'qty' => $item['qty'],
                    'unit_price' => $item['price'],
                    'line_total' => $lineTotal,
                    'line_net_amount' => $lineTotal,
                    'line_vat_amount' => 0,
                    'line_gross_amount' => $lineTotal,
                    'pricing_source' => 'manual',
                ]);

                $createdCount++;
            }
        }

        $this->command->info("Created {$createdCount} sale items for {$sales->count()} sales.");
    }

    /**
     * Generate appropriate items based on sale total
     */
    private function generateItemsForSaleTotal(float $total, array $products): array
    {
        $items = [];

        // Match common totals from SaleSeeder
        switch ($total) {
            case 950.00:
                // 1x 11kg
                $items[] = [
                    'variant' => $products['11kg']['variant'],
                    'price' => $products['11kg']['price'],
                    'qty' => 1,
                ];
                break;

            case 1750.00:
                // 1x 22kg
                $items[] = [
                    'variant' => $products['22kg']['variant'],
                    'price' => $products['22kg']['price'],
                    'qty' => 1,
                ];
                break;

            case 3500.00:
                // 1x 50kg OR 2x 22kg
                if (rand(0, 1)) {
                    $items[] = [
                        'variant' => $products['50kg']['variant'],
                        'price' => $products['50kg']['price'],
                        'qty' => 1,
                    ];
                } else {
                    $items[] = [
                        'variant' => $products['22kg']['variant'],
                        'price' => $products['22kg']['price'],
                        'qty' => 2,
                    ];
                }
                break;

            case 5250.00:
                // 3x 22kg
                $items[] = [
                    'variant' => $products['22kg']['variant'],
                    'price' => $products['22kg']['price'],
                    'qty' => 3,
                ];
                break;

            case 7000.00:
                // 4x 22kg OR 2x 50kg
                if (rand(0, 1)) {
                    $items[] = [
                        'variant' => $products['22kg']['variant'],
                        'price' => $products['22kg']['price'],
                        'qty' => 4,
                    ];
                } else {
                    $items[] = [
                        'variant' => $products['50kg']['variant'],
                        'price' => $products['50kg']['price'],
                        'qty' => 2,
                    ];
                }
                break;

            case 10500.00:
                // 6x 22kg OR 3x 50kg
                if (rand(0, 1)) {
                    $items[] = [
                        'variant' => $products['22kg']['variant'],
                        'price' => $products['22kg']['price'],
                        'qty' => 6,
                    ];
                } else {
                    $items[] = [
                        'variant' => $products['50kg']['variant'],
                        'price' => $products['50kg']['price'],
                        'qty' => 3,
                    ];
                }
                break;

            case 15750.00:
                // 9x 22kg (bulk corporate order)
                $items[] = [
                    'variant' => $products['22kg']['variant'],
                    'price' => $products['22kg']['price'],
                    'qty' => 9,
                ];
                break;

            default:
                // For any other amount, try to approximate with 22kg units
                $qty = max(1, round($total / $products['22kg']['price']));
                $items[] = [
                    'variant' => $products['22kg']['variant'],
                    'price' => $products['22kg']['price'],
                    'qty' => $qty,
                ];
                break;
        }

        return $items;
    }
}