<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;


class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $supplierIds = Supplier::pluck('id')->toArray();

        if (count($supplierIds) < 2) {
            throw new \Exception('Need at least 2 suppliers to run this seeder');
        }

        // 1. LPG Cylinders
        $lpgProduct = Product::create([
            'sku' => 'LPG-BASE',
            'name' => 'LPG Cylinder',
            'category' => 'lpg',
            'is_active' => true,
        ]);

        $lpgVariants = [
            ['size' => 5, 'sku' => 'LPG-5KG'],
            ['size' => 6, 'sku' => 'LPG-6KG'],
            ['size' => 8, 'sku' => 'LPG-8KG'],
            ['size' => 10, 'sku' => 'LPG-10KG'],
            ['size' => 11, 'sku' => 'LPG-11KG'],
            ['size' => 12, 'sku' => 'LPG-12KG'],
            ['size' => 14, 'sku' => 'LPG-14KG'],
            ['size' => 15, 'sku' => 'LPG-15KG'],
            ['size' => 18, 'sku' => 'LPG-18KG'],
            ['size' => 20, 'sku' => 'LPG-20KG'],
            ['size' => 22, 'sku' => 'LPG-22KG'],
            ['size' => 25, 'sku' => 'LPG-25KG'],
            ['size' => 30, 'sku' => 'LPG-30KG'],
            ['size' => 35, 'sku' => 'LPG-35KG'],
            ['size' => 40, 'sku' => 'LPG-40KG'],
            ['size' => 45, 'sku' => 'LPG-45KG'],
            ['size' => 50, 'sku' => 'LPG-50KG'],
            ['size' => 60, 'sku' => 'LPG-60KG'],
            ['size' => 70, 'sku' => 'LPG-70KG'],
            ['size' => 80, 'sku' => 'LPG-80KG'],
            ['size' => 100, 'sku' => 'LPG-100KG'],
            ['size' => 120, 'sku' => 'LPG-120KG'],
            ['size' => 150, 'sku' => 'LPG-150KG'],
            ['size' => 200, 'sku' => 'LPG-200KG'],
            ['size' => 250, 'sku' => 'LPG-250KG'],
            ['size' => 300, 'sku' => 'LPG-300KG'],
            ['size' => 400, 'sku' => 'LPG-400KG'],
            ['size' => 500, 'sku' => 'LPG-500KG'],
            ['size' => 750, 'sku' => 'LPG-750KG'],
            ['size' => 1000, 'sku' => 'LPG-1000KG'],
        ];

        $this->createProductVariants($lpgProduct, $lpgVariants, $supplierIds);

        // 2. LPG Accessories
        $accessoriesProduct = Product::create([
            'sku' => 'ACC-BASE',
            'name' => 'LPG Accessories',
            'category' => 'accessories',
            'is_active' => true,
        ]);

        $accessoryVariants = [
            ['name' => 'Regulator', 'sku' => 'ACC-REG-STD'],
            ['name' => 'Hose (1 meter)', 'sku' => 'ACC-HOSE-1M'],
            ['name' => 'Hose (2 meter)', 'sku' => 'ACC-HOSE-2M'],
            ['name' => 'Hose (3 meter)', 'sku' => 'ACC-HOSE-3M'],
            ['name' => 'Valve', 'sku' => 'ACC-VALVE'],
            ['name' => 'Safety Cap', 'sku' => 'ACC-CAP'],
            ['name' => 'Leak Detector', 'sku' => 'ACC-DETECTOR'],
        ];

        foreach ($accessoryVariants as $variantData) {
            $variant = ProductVariant::create([
                'product_id' => $accessoriesProduct->id,
                'variant_name' => $variantData['name'],
                'size_value' => null,
                'size_unit' => null,
                'container_type' => 'accessory',
                'barcode' => $variantData['sku'],
                'is_active' => true,
            ]);

            $this->attachSuppliers($variant, $supplierIds);
        }

        // 3. Refill Services
        $refillProduct = Product::create([
            'sku' => 'SVC-REFILL',
            'name' => 'LPG Refill Service',
            'category' => 'service',
            'is_active' => true,
        ]);

        $refillVariants = [
            ['size' => 11, 'sku' => 'SVC-REFILL-11KG'],
            ['size' => 22, 'sku' => 'SVC-REFILL-22KG'],
            ['size' => 50, 'sku' => 'SVC-REFILL-50KG'],
        ];

        $this->createProductVariants($refillProduct, $refillVariants, $supplierIds, 'service');

        // 4. Cylinder Rental
        $rentalProduct = Product::create([
            'sku' => 'RENT-BASE',
            'name' => 'Cylinder Rental',
            'category' => 'rental',
            'is_active' => true,
        ]);

        $rentalVariants = [
            ['size' => 11, 'sku' => 'RENT-11KG'],
            ['size' => 22, 'sku' => 'RENT-22KG'],
            ['size' => 50, 'sku' => 'RENT-50KG'],
        ];

        $this->createProductVariants($rentalProduct, $rentalVariants, $supplierIds, 'rental');

        // 5. Delivery Service
        $deliveryProduct = Product::create([
            'sku' => 'SVC-DELIVERY',
            'name' => 'Delivery Service',
            'category' => 'service',
            'is_active' => true,
        ]);

        $deliveryVariants = [
            ['name' => 'Standard Delivery', 'sku' => 'SVC-DEL-STD'],
            ['name' => 'Express Delivery', 'sku' => 'SVC-DEL-EXP'],
            ['name' => 'Same Day Delivery', 'sku' => 'SVC-DEL-SAME'],
        ];

        foreach ($deliveryVariants as $variantData) {
            $variant = ProductVariant::create([
                'product_id' => $deliveryProduct->id,
                'variant_name' => $variantData['name'],
                'size_value' => null,
                'size_unit' => null,
                'container_type' => 'service',
                'barcode' => $variantData['sku'],
                'is_active' => true,
            ]);

            $this->attachSuppliers($variant, $supplierIds);
        }
    }

    private function createProductVariants($product, $variants, $supplierIds, $containerType = 'cylinder')
    {
        foreach ($variants as $variantData) {
            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'variant_name' => $variantData['size'] . 'kg',
                'size_value' => $variantData['size'],
                'size_unit' => 'kg',
                'container_type' => $containerType,
                'barcode' => $variantData['sku'],
                'is_active' => true,
            ]);

            $this->attachSuppliers($variant, $supplierIds);
        }
    }

    
    private function attachSuppliers($variant, $supplierIds)
    {
        $numSuppliers = rand(1, min(3, count($supplierIds)));
        $randomSuppliers = (array) array_rand(array_flip($supplierIds), $numSuppliers);
        
        foreach ($randomSuppliers as $index => $supplierId) {
            
            DB::table('supplier_products')->insert([
                'supplier_id' => $supplierId,
                'product_variant_id' => $variant->id,
                'supplier_sku' => 'SUP-' . $variant->barcode,
                'lead_time_days' => rand(1, 7),
                'is_primary' => $index === 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}