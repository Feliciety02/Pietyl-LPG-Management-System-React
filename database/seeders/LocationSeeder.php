<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            // Warehouses
            [
                'name' => 'Main Warehouse - Sasa',
                'location_type' => 'warehouse',
                'is_active' => true,
            ],
            [
                'name' => 'Central Warehouse - Lanang',
                'location_type' => 'warehouse',
                'is_active' => true,
            ],
            [
                'name' => 'South Warehouse - Toril',
                'location_type' => 'warehouse',
                'is_active' => true,
            ],
            [
                'name' => 'North Warehouse - Buhangin',
                'location_type' => 'warehouse',
                'is_active' => true,
            ],

            // Retail Stores
            [
                'name' => 'Downtown Store - Poblacion',
                'location_type' => 'store',
                'is_active' => true,
            ],
            [
                'name' => 'Matina Store',
                'location_type' => 'store',
                'is_active' => true,
            ],
            [
                'name' => 'Bajada Store',
                'location_type' => 'store',
                'is_active' => true,
            ],
            [
                'name' => 'Ecoland Store',
                'location_type' => 'store',
                'is_active' => true,
            ],
            [
                'name' => 'Catalunan Store',
                'location_type' => 'store',
                'is_active' => true,
            ],

            // Distribution Centers
            [
                'name' => 'DC Calinan',
                'location_type' => 'distribution_center',
                'is_active' => true,
            ],
            [
                'name' => 'DC Mintal',
                'location_type' => 'distribution_center',
                'is_active' => true,
            ],
            [
                'name' => 'DC Tibungco',
                'location_type' => 'distribution_center',
                'is_active' => true,
            ],

            // Delivery Hubs
            [
                'name' => 'Delivery Hub - City Proper',
                'location_type' => 'delivery_hub',
                'is_active' => true,
            ],
            [
                'name' => 'Delivery Hub - Samal Island',
                'location_type' => 'delivery_hub',
                'is_active' => true,
            ],

            // Service Centers
            [
                'name' => 'Service Center - Agdao',
                'location_type' => 'service_center',
                'is_active' => true,
            ],
            [
                'name' => 'Service Center - Panacan',
                'location_type' => 'service_center',
                'is_active' => true,
            ],

            // Inactive/Old Locations
            [
                'name' => 'Old Warehouse - Bangkal',
                'location_type' => 'warehouse',
                'is_active' => false,
            ],
            [
                'name' => 'Closed Store - Ma-a',
                'location_type' => 'store',
                'is_active' => false,
            ],

            // Mobile Units
            [
                'name' => 'Delivery Truck #1',
                'location_type' => 'mobile',
                'is_active' => true,
            ],
            [
                'name' => 'Delivery Truck #2',
                'location_type' => 'mobile',
                'is_active' => true,
            ],
            [
                'name' => 'Delivery Truck #3',
                'location_type' => 'mobile',
                'is_active' => true,
            ],
        ];

        foreach ($locations as $location) {
            Location::create($location);
        }
    }
}