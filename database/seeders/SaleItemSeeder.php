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

        $variants = ProductVariant::all();
        
        if ($variants->isEmpty()) {
            $this->command->warn('No product variants found.');
            return;
        }

        // Get specific variants
        $variant11kg = $variants->where('size_value', 11.0)->first();
        $variant22kg = $variants->where('size_value', 22.0)->first();
        $variant50kg = $variants->where('size_value', 50.0)->first();

        $price11kg = $variant11kg?->product?->price ?? 0;
        $price22kg = $variant22kg?->product?->price ?? 0;
        $price50kg = $variant50kg?->product?->price ?? 0;

        // Sale 1: 11kg refill - PAID
        if ($sales->count() >= 1 && $variant11kg) {
            SaleItem::create([
                'sale_id' => $sales[0]->id,
                'product_variant_id' => $variant11kg->id,
                'qty' => 1,
                'unit_price' => $price11kg,
                'pricing_source' => 'base_price',
            ]);
        }

        // Sale 2: 22kg refill - PAID
        if ($sales->count() >= 2 && $variant22kg) {
            SaleItem::create([
                'sale_id' => $sales[1]->id,
                'product_variant_id' => $variant22kg->id,
                'qty' => 1,
                'unit_price' => $price22kg,
                'pricing_source' => 'base_price',
            ]);
        }

        // Sale 3: 50kg refill - PENDING
        if ($sales->count() >= 3 && $variant50kg) {
            SaleItem::create([
                'sale_id' => $sales[2]->id,
                'product_variant_id' => $variant50kg->id,
                'qty' => 1,
                'unit_price' => $price50kg,
                'pricing_source' => 'base_price',
            ]);
        }

        // Sale 4: 3x 22kg - PAID (corporate)
        if ($sales->count() >= 4 && $variant22kg) {
            SaleItem::create([
                'sale_id' => $sales[3]->id,
                'product_variant_id' => $variant22kg->id,
                'qty' => 3,
                'unit_price' => $price22kg,
                'pricing_source' => 'base_price',
            ]);
        }

        // Sale 5: 11kg refill - FAILED
        if ($sales->count() >= 5 && $variant11kg) {
            SaleItem::create([
                'sale_id' => $sales[4]->id,
                'product_variant_id' => $variant11kg->id,
                'qty' => 1,
                'unit_price' => $price11kg,
                'pricing_source' => 'base_price',
            ]);
        }

        // Sale 6: 22kg refill - PAID
        if ($sales->count() >= 6 && $variant22kg) {
            SaleItem::create([
                'sale_id' => $sales[5]->id,
                'product_variant_id' => $variant22kg->id,
                'qty' => 1,
                'unit_price' => $price22kg,
                'pricing_source' => 'base_price',
            ]);
        }

        // Sale 7: 2x 50kg - PENDING (hotel order)
        if ($sales->count() >= 7 && $variant50kg) {
            SaleItem::create([
                'sale_id' => $sales[6]->id,
                'product_variant_id' => $variant50kg->id,
                'qty' => 2,
                'unit_price' => $price50kg,
                'pricing_source' => 'base_price',
            ]);
        }
    }
}
