<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Supplier;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $supplierIds = Supplier::pluck('id')->toArray();

        if (count($supplierIds) < 2) {
            throw new \Exception('Need at least 2 suppliers to run this seeder');
        }

        $products = [
            ['sku' => 'LPG-5KG', 'name' => 'LPG Cylinder', 'variant' => '5kg'],
            ['sku' => 'LPG-6KG', 'name' => 'LPG Cylinder', 'variant' => '6kg'],
            ['sku' => 'LPG-8KG', 'name' => 'LPG Cylinder', 'variant' => '8kg'],
            ['sku' => 'LPG-10KG', 'name' => 'LPG Cylinder', 'variant' => '10kg'],
            ['sku' => 'LPG-11KG', 'name' => 'LPG Cylinder', 'variant' => '11kg'],
            ['sku' => 'LPG-12KG', 'name' => 'LPG Cylinder', 'variant' => '12kg'],
            ['sku' => 'LPG-14KG', 'name' => 'LPG Cylinder', 'variant' => '14kg'],
            ['sku' => 'LPG-15KG', 'name' => 'LPG Cylinder', 'variant' => '15kg'],
            ['sku' => 'LPG-18KG', 'name' => 'LPG Cylinder', 'variant' => '18kg'],
            ['sku' => 'LPG-20KG', 'name' => 'LPG Cylinder', 'variant' => '20kg'],
            ['sku' => 'LPG-22KG', 'name' => 'LPG Cylinder', 'variant' => '22kg'],
            ['sku' => 'LPG-25KG', 'name' => 'LPG Cylinder', 'variant' => '25kg'],
            ['sku' => 'LPG-30KG', 'name' => 'LPG Cylinder', 'variant' => '30kg'],
            ['sku' => 'LPG-35KG', 'name' => 'LPG Cylinder', 'variant' => '35kg'],
            ['sku' => 'LPG-40KG', 'name' => 'LPG Cylinder', 'variant' => '40kg'],
            ['sku' => 'LPG-45KG', 'name' => 'LPG Cylinder', 'variant' => '45kg'],
            ['sku' => 'LPG-50KG', 'name' => 'LPG Cylinder', 'variant' => '50kg'],
            ['sku' => 'LPG-60KG', 'name' => 'LPG Cylinder', 'variant' => '60kg'],
            ['sku' => 'LPG-70KG', 'name' => 'LPG Cylinder', 'variant' => '70kg'],
            ['sku' => 'LPG-80KG', 'name' => 'LPG Cylinder', 'variant' => '80kg'],
            ['sku' => 'LPG-100KG', 'name' => 'LPG Cylinder', 'variant' => '100kg'],
            ['sku' => 'LPG-120KG', 'name' => 'LPG Cylinder', 'variant' => '120kg'],
            ['sku' => 'LPG-150KG', 'name' => 'LPG Cylinder', 'variant' => '150kg'],
            ['sku' => 'LPG-200KG', 'name' => 'LPG Cylinder', 'variant' => '200kg'],
            ['sku' => 'LPG-250KG', 'name' => 'LPG Cylinder', 'variant' => '250kg'],
            ['sku' => 'LPG-300KG', 'name' => 'LPG Cylinder', 'variant' => '300kg'],
            ['sku' => 'LPG-400KG', 'name' => 'LPG Cylinder', 'variant' => '400kg'],
            ['sku' => 'LPG-500KG', 'name' => 'LPG Cylinder', 'variant' => '500kg'],
            ['sku' => 'LPG-750KG', 'name' => 'LPG Cylinder', 'variant' => '750kg'],
            ['sku' => 'LPG-1000KG', 'name' => 'LPG Cylinder', 'variant' => '1000kg'],
        ];

        foreach ($products as $productData) {
            $product = Product::create($productData);

            // Attach 1-3 random suppliers to each product
            $numSuppliers = rand(1, min(3, count($supplierIds)));
            $randomSuppliers = array_rand(array_flip($supplierIds), $numSuppliers);
            
            if (!is_array($randomSuppliers)) {
                $randomSuppliers = [$randomSuppliers];
            }

            foreach ($randomSuppliers as $index => $supplierId) {
                $product->suppliers()->attach($supplierId, [
                    'is_default' => $index === 0, // First one is default
                ]);
            }
        }

        // Create one product with 2 specific suppliers
        $lpg11kg = Product::create([
            'sku' => 'LPG-11KG-SPECIAL',
            'name' => 'LPG Cylinder',
            'variant' => '11kg',
        ]);

        $lpg11kg->suppliers()->attach($supplierIds[0], ['is_default' => true]);
        $lpg11kg->suppliers()->attach($supplierIds[1], ['is_default' => false]);
    }
}