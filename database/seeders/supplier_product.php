<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $suppliers = [
            // Major LPG Suppliers
            [
                'name' => 'Petron LPG Supply',
                'phone' => '0917-123-4567',
                'email' => 'sales@petronlpg.ph',
                'address' => 'Km. 14 Sasa, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Shellane Distributors',
                'phone' => '0918-234-5678',
                'email' => 'info@shellane.ph',
                'address' => 'Lanang Business Park, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Regasco Trading',
                'phone' => '0919-345-6789',
                'email' => 'contact@regasco.ph',
                'address' => 'Toril, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Total LPG Philippines',
                'phone' => '0920-456-7890',
                'email' => 'sales@totallpg.ph',
                'address' => 'Buhangin, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Gasul Depot',
                'phone' => '0921-567-8901',
                'email' => 'depot@gasul.ph',
                'address' => 'Tibungco, Davao City, Philippines',
                'is_active' => true,
            ],

            // Regional Suppliers
            [
                'name' => 'Northern LPG Trading',
                'phone' => '0932-112-3344',
                'email' => 'info@northernlpg.ph',
                'address' => 'Bajada, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Southern Gas Solutions',
                'phone' => '0933-221-4455',
                'email' => 'support@southerngas.ph',
                'address' => 'Mintal, Davao City, Philippines',
                'is_active' => false,
            ],
            [
                'name' => 'Davao LPG Hub',
                'phone' => '0934-332-5566',
                'email' => 'sales@davaolpghub.ph',
                'address' => 'Matina, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Island Fuel Supply Co.',
                'phone' => '0935-443-6677',
                'email' => 'contact@islandfuel.ph',
                'address' => 'Samal Island, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Vismin LPG Services',
                'phone' => '0936-554-7788',
                'email' => 'info@visminlpg.ph',
                'address' => 'Ecoland, Davao City, Philippines',
                'is_active' => true,
            ],

            // Local Distributors
            [
                'name' => 'Prime Gasline Corporation',
                'phone' => '0937-665-8899',
                'email' => 'admin@primegasline.ph',
                'address' => 'Bangkal, Davao City, Philippines',
                'is_active' => false,
            ],
            [
                'name' => 'Metro South LPG Trading',
                'phone' => '0938-776-9900',
                'email' => 'sales@metrosouthlpg.ph',
                'address' => 'Calinan, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Eastwind Gas Supply',
                'phone' => '0939-887-0011',
                'email' => 'inquiry@eastwindgas.ph',
                'address' => 'Buhangin Proper, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'LPG Master Distributors',
                'phone' => '0940-998-1122',
                'email' => 'master@lpgdistributors.ph',
                'address' => 'Toril Poblacion, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Panabo Gas Traders',
                'phone' => '0941-221-3344',
                'email' => 'panabo@gastraders.ph',
                'address' => 'Panabo City, Philippines',
                'is_active' => false,
            ],

            // Accessory Suppliers
            [
                'name' => 'Gas Parts & Accessories Inc.',
                'phone' => '0942-332-4455',
                'email' => 'sales@gasparts.ph',
                'address' => 'Agdao, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Safety Equipment Trading',
                'phone' => '0943-443-5566',
                'email' => 'info@safetyequip.ph',
                'address' => 'Panacan, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Industrial Gas Solutions',
                'phone' => '0944-554-6677',
                'email' => 'industrial@gassolutions.ph',
                'address' => 'Lasang, Davao City, Philippines',
                'is_active' => true,
            ],

            // Cylinder Manufacturers/Suppliers
            [
                'name' => 'Philippine Steel Cylinder Corp.',
                'phone' => '0945-665-7788',
                'email' => 'sales@steelcylinder.ph',
                'address' => 'Sasa, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Metro Cylinder Manufacturing',
                'phone' => '0946-776-8899',
                'email' => 'info@metrocylinder.ph',
                'address' => 'Panacan Industrial Area, Davao City, Philippines',
                'is_active' => true,
            ],

            // Valve & Regulator Suppliers
            [
                'name' => 'Valve Masters Philippines',
                'phone' => '0947-887-9900',
                'email' => 'valves@masters.ph',
                'address' => 'Cabaguio Avenue, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Regulator Tech Supply',
                'phone' => '0948-998-0011',
                'email' => 'tech@regulatortech.ph',
                'address' => 'Km. 7 Buhangin, Davao City, Philippines',
                'is_active' => true,
            ],

            // Hose & Fitting Suppliers
            [
                'name' => 'Flex Hose Trading Co.',
                'phone' => '0949-123-2233',
                'email' => 'sales@flexhose.ph',
                'address' => 'Ulas, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Gas Fittings Unlimited',
                'phone' => '0950-234-3344',
                'email' => 'info@gasfittings.ph',
                'address' => 'Ma-a, Davao City, Philippines',
                'is_active' => true,
            ],

            // Maintenance & Service Providers
            [
                'name' => 'LPG Service & Maintenance Inc.',
                'phone' => '0951-345-4455',
                'email' => 'service@lpgmaintenance.ph',
                'address' => 'Catalunan Grande, Davao City, Philippines',
                'is_active' => true,
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create($supplier);
        }
    }
}