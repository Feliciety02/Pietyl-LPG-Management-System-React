<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SupplierProductResetSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        foreach ([
            'sale_items',
            'restock_request_items',
            'stock_movements',
            'purchase_items',
            'inventory_balances',
            'supplier_products',
            'product_variants',
            'products',
            'suppliers',
        ] as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $supplierNames = [
            'Cotabato Roma Enterprises',
            'CYBS Marketing',
            'Towngas LPG Trading',
            'M.Conpinco Home Improvement Super Center Inc',
        ];

        $supplierMap = [];
        foreach ($supplierNames as $name) {
            $supplier = Supplier::create([
                'name' => $name,
                'is_active' => true,
            ]);
            $supplierMap[$name] = $supplier->id;
        }

        $seedItems = [
            ['name' => 'Petron Gasul 50kg', 'supplier' => 'Cotabato Roma Enterprises', 'supplier_cost' => 3570, 'price' => 4200, 'category' => 'lpg'],
            ['name' => 'Petron Gasul 22kg', 'supplier' => 'Cotabato Roma Enterprises', 'supplier_cost' => 1700, 'price' => 2000, 'category' => 'lpg'],
            ['name' => 'Petron Gasul Snap On 11kg', 'supplier' => 'Cotabato Roma Enterprises', 'supplier_cost' => 850, 'price' => 1000, 'category' => 'lpg'],
            ['name' => 'Petron Gasul POL Valve 11kg', 'supplier' => 'Cotabato Roma Enterprises', 'supplier_cost' => 850, 'price' => 1000, 'category' => 'lpg'],
            ['name' => 'Petron Gasul Gasulette Snap On 2.7kg', 'supplier' => 'Cotabato Roma Enterprises', 'supplier_cost' => 340, 'price' => 400, 'category' => 'lpg'],
            ['name' => 'Phoenix Super LPG Compact 11kg', 'supplier' => 'CYBS Marketing', 'supplier_cost' => 850, 'price' => 1000, 'category' => 'lpg'],
            ['name' => 'Phoenix Super LPG Budget 1.0kg', 'supplier' => 'CYBS Marketing', 'supplier_cost' => 170, 'price' => 200, 'category' => 'lpg'],
            ['name' => 'Solane Pol Valve 50kg', 'supplier' => 'Towngas LPG Trading', 'supplier_cost' => 3570, 'price' => 4200, 'category' => 'lpg'],
            ['name' => 'Solane AS 11kg', 'supplier' => 'Towngas LPG Trading', 'supplier_cost' => 965, 'price' => 1135, 'category' => 'lpg'],
            ['name' => 'Solane Pol Valve 11kg', 'supplier' => 'Towngas LPG Trading', 'supplier_cost' => 965, 'price' => 1135, 'category' => 'lpg'],
            ['name' => 'Solane Sakto AS 1.4kg', 'supplier' => 'Towngas LPG Trading', 'supplier_cost' => 255, 'price' => 300, 'category' => 'lpg'],
            ['name' => 'Fiesta Gas Pol Valve 11kg', 'supplier' => 'Cotabato Roma Enterprises', 'supplier_cost' => 803, 'price' => 945, 'category' => 'lpg'],
            ['name' => 'Fiesta Gas Pol Valve 5.0kg', 'supplier' => 'Cotabato Roma Enterprises', 'supplier_cost' => 510, 'price' => 600, 'category' => 'lpg'],
            ['name' => 'Fiesta Gas Snap On 2.7kg', 'supplier' => 'Cotabato Roma Enterprises', 'supplier_cost' => 340, 'price' => 400, 'category' => 'lpg'],
            ['name' => 'Prycegas 50kg', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 3570, 'price' => 4200, 'category' => 'lpg'],
            ['name' => 'Prycegas 22kg', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 1700, 'price' => 2000, 'category' => 'lpg'],
            ['name' => 'Prycegas 11kg', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 1020, 'price' => 1200, 'category' => 'lpg'],
            ['name' => 'Prycegas Power Kalan 2.7kg', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 289, 'price' => 340, 'category' => 'stove'],
            ['name' => 'La Germania G733', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 2720, 'price' => 3200, 'category' => 'stove'],
            ['name' => 'La Germania G650', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 2380, 'price' => 2800, 'category' => 'stove'],
            ['name' => 'La Germania G1000max', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 3825, 'price' => 4500, 'category' => 'stove'],
            ['name' => 'La Germania G150', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 1615, 'price' => 1900, 'category' => 'stove'],
            ['name' => 'La Germania G390', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 2210, 'price' => 2600, 'category' => 'stove'],
            ['name' => 'La Germania G702', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 2550, 'price' => 3000, 'category' => 'stove'],
            ['name' => 'Asahi GS446', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 553, 'price' => 650, 'category' => 'stove'],
            ['name' => 'Asahi GS447', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 578, 'price' => 680, 'category' => 'stove'],
            ['name' => 'Asahi GS667', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 612, 'price' => 720, 'category' => 'stove'],
            ['name' => 'LPG Hose Clip', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 68, 'price' => 80, 'category' => 'accessories'],
            ['name' => 'LPG Hose', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 255, 'price' => 300, 'category' => 'accessories'],
            ['name' => 'All Brands Pol Valve Regulator', 'supplier' => 'M.Conpinco Home Improvement Super Center Inc', 'supplier_cost' => 510, 'price' => 600, 'category' => 'accessories'],
            ['name' => 'Phoenix Compact Regulator', 'supplier' => 'CYBS Marketing', 'supplier_cost' => 510, 'price' => 600, 'category' => 'accessories'],
            ['name' => 'Petron Gasul Snap On Regulator', 'supplier' => 'Cotabato Roma Enterprises', 'supplier_cost' => 510, 'price' => 600, 'category' => 'accessories'],
            ['name' => 'Solane AS Regulator', 'supplier' => 'Towngas LPG Trading', 'supplier_cost' => 510, 'price' => 600, 'category' => 'accessories'],
        ];

        $usedSkus = [];

        foreach ($seedItems as $item) {
            $supplierId = $supplierMap[$item['supplier']] ?? null;
            if (!$supplierId) {
                throw new \Exception("Supplier not found: {$item['supplier']}");
            }

            [$sizeValue, $sizeUnit, $variantName] = $this->extractSize($item['name']);
            $sku = $this->makeSku($item['name'], $usedSkus);

            $product = Product::create([
                'sku' => $sku,
                'name' => $item['name'],
                'category' => $item['category'],
                'supplier_id' => $supplierId,
                'supplier_cost' => $item['supplier_cost'],
                'price' => $item['price'],
                'is_active' => true,
            ]);

            ProductVariant::create([
                'product_id' => $product->id,
                'variant_name' => $variantName,
                'size_value' => $sizeValue,
                'size_unit' => $sizeUnit,
                'container_type' => $item['category'],
                'is_active' => true,
            ]);
        }
    }

    private function extractSize(string $name): array
    {
        if (preg_match('/(\d+(?:\.\d+)?)\s*kg/i', $name, $matches)) {
            $value = (float) $matches[1];
            $variantName = rtrim(rtrim($matches[1], '0'), '.') . 'kg';
            return [$value, 'kg', $variantName];
        }

        return [null, null, 'Standard'];
    }

    private function makeSku(string $name, array &$usedSkus): string
    {
        $base = strtoupper(preg_replace('/[^A-Z0-9]+/i', '-', $name));
        $base = trim($base, '-');
        $base = substr($base, 0, 90);

        $sku = $base;
        $counter = 2;
        while (in_array($sku, $usedSkus, true)) {
            $suffix = '-' . $counter;
            $sku = substr($base, 0, 90 - strlen($suffix)) . $suffix;
            $counter++;
        }

        $usedSkus[] = $sku;
        return $sku;
    }
}
