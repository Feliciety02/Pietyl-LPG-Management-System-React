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
            [
                'name' => 'Petron LPG Supply',
                'contact_person' => 'Juan Dela Cruz',
                'phone' => '0917-123-4567',
                'email' => 'sales@petronlpg.ph',
                'address' => 'Km. 14 Sasa, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Shellane Distributors',
                'contact_person' => 'Maria Santos',
                'phone' => '0918-234-5678',
                'email' => 'info@shellane.ph',
                'address' => 'Lanang Business Park, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Regasco Trading',
                'contact_person' => 'Pedro Reyes',
                'phone' => '0919-345-6789',
                'email' => 'contact@regasco.ph',
                'address' => 'Toril, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Total LPG Philippines',
                'contact_person' => 'Ana Gonzales',
                'phone' => '0920-456-7890',
                'email' => 'sales@totallpg.ph',
                'address' => 'Buhangin, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Gasul Depot',
                'contact_person' => 'Rico Tan',
                'phone' => '0921-567-8901',
                'email' => 'depot@gasul.ph',
                'address' => 'Tibungco, Davao City, Philippines',
                'is_active' => true,
            ],

            [
                'name' => 'Northern LPG Trading',
                'contact_person' => 'Liza Mendoza',
                'phone' => '0932-112-3344',
                'email' => 'info@northernlpg.ph',
                'address' => 'Bajada, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Southern Gas Solutions',
                'contact_person' => 'Mark Salazar',
                'phone' => '0933-221-4455',
                'email' => 'support@southerngas.ph',
                'address' => 'Mintal, Davao City, Philippines',
                'is_active' => false,
            ],
            [
                'name' => 'Davao LPG Hub',
                'contact_person' => 'Ella Navarro',
                'phone' => '0934-332-5566',
                'email' => 'sales@davaolpghub.ph',
                'address' => 'Matina, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Island Fuel Supply Co.',
                'contact_person' => 'Kevin Uy',
                'phone' => '0935-443-6677',
                'email' => 'contact@islandfuel.ph',
                'address' => 'Samal Island, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Vismin LPG Services',
                'contact_person' => 'Tina Aguilar',
                'phone' => '0936-554-7788',
                'email' => 'info@visminlpg.ph',
                'address' => 'Ecoland, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Prime Gasline Corporation',
                'contact_person' => 'Jared Ong',
                'phone' => '0937-665-8899',
                'email' => 'admin@primegasline.ph',
                'address' => 'Bangkal, Davao City, Philippines',
                'is_active' => false,
            ],
            [
                'name' => 'Metro South LPG Trading',
                'contact_person' => 'Carla Villanueva',
                'phone' => '0938-776-9900',
                'email' => 'sales@metrosouthlpg.ph',
                'address' => 'Calinan, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Eastwind Gas Supply',
                'contact_person' => 'Jonathan Cruz',
                'phone' => '0939-887-0011',
                'email' => 'inquiry@eastwindgas.ph',
                'address' => 'Buhangin Proper, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'LPG Master Distributors',
                'contact_person' => 'Fiona Tiu',
                'phone' => '0940-998-1122',
                'email' => 'master@lpgdistributors.ph',
                'address' => 'Toril Poblacion, Davao City, Philippines',
                'is_active' => true,
            ],
            [
                'name' => 'Panabo Gas Traders',
                'contact_person' => 'Harvey Diaz',
                'phone' => '0941-221-3344',
                'email' => 'panabo@gastraders.ph',
                'address' => 'Panabo City, Philippines',
                'is_active' => false,
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create($supplier);
        }

    }
}