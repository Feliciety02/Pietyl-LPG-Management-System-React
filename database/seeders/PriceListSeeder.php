<?php

namespace Database\Seeders;

use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class PriceListSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Standard Retail Pricing (Active)
        $retailPriceList = PriceList::create([
            'name' => 'Standard Retail Pricing 2026',
            'is_active' => true,
            'starts_at' => now(),
            'ends_at' => null,
        ]);

        // 2. Wholesale Pricing (Active)
        $wholesalePriceList = PriceList::create([
            'name' => 'Wholesale Pricing 2026',
            'is_active' => true,
            'starts_at' => now(),
            'ends_at' => null,
        ]);

        // 3. Promo/Discount Pricing (Active for limited time)
        $promoPriceList = PriceList::create([
            'name' => 'New Year Promo 2026',
            'is_active' => true,
            'starts_at' => now()->startOfYear(),
            'ends_at' => now()->startOfYear()->addMonth(),
        ]);

        // 4. Senior Citizen / PWD Discount (Active)
        $seniorPwdPriceList = PriceList::create([
            'name' => 'Senior Citizen & PWD Pricing',
            'is_active' => true,
            'starts_at' => now(),
            'ends_at' => null,
        ]);

        // 5. Past pricing (Inactive - for historical records)
        $oldPriceList = PriceList::create([
            'name' => 'Standard Retail Pricing 2025',
            'is_active' => false,
            'starts_at' => now()->subYear(),
            'ends_at' => now()->subMonth(),
        ]);

        // Get all product variants
        $variants = ProductVariant::all();

        foreach ($variants as $variant) {
            // Retail prices
            PriceListItem::create([
                'price_list_id' => $retailPriceList->id,
                'product_variant_id' => $variant->id,
                'price' => $this->getRetailPrice($variant),
                'currency' => 'PHP',
            ]);

            // Wholesale prices (10% discount)
            PriceListItem::create([
                'price_list_id' => $wholesalePriceList->id,
                'product_variant_id' => $variant->id,
                'price' => $this->getRetailPrice($variant) * 0.90,
                'currency' => 'PHP',
            ]);

            // Promo prices (15% discount)
            PriceListItem::create([
                'price_list_id' => $promoPriceList->id,
                'product_variant_id' => $variant->id,
                'price' => $this->getRetailPrice($variant) * 0.85,
                'currency' => 'PHP',
            ]);

            // Senior/PWD prices (20% discount as per PH law)
            PriceListItem::create([
                'price_list_id' => $seniorPwdPriceList->id,
                'product_variant_id' => $variant->id,
                'price' => $this->getRetailPrice($variant) * 0.80,
                'currency' => 'PHP',
            ]);

            // Old prices (slightly lower than current)
            PriceListItem::create([
                'price_list_id' => $oldPriceList->id,
                'product_variant_id' => $variant->id,
                'price' => $this->getRetailPrice($variant) * 0.95,
                'currency' => 'PHP',
            ]);
        }
    }

    private function getRetailPrice($variant): float
    {
        return match($variant->size_value) {
            2.7 => 450.00,
            11.0 => 950.00,
            22.0 => 1750.00,
            50.0 => 3500.00,
            25.0 => 1800.00,
            150.0 => 10000.00,
            750.0 => 45000.00,
            default => round(500 + rand(-50, 50), 2), // add some randomness for unknown sizes
        };
    }
}