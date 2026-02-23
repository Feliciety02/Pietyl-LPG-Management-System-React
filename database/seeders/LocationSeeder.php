<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            // Warehouses (9)
            ['name' => 'Main Warehouse - Sasa',             'location_type' => 'warehouse',             'is_active' => true],
            ['name' => 'Central Warehouse - Lanang',        'location_type' => 'warehouse',             'is_active' => true],
            ['name' => 'South Warehouse - Toril',           'location_type' => 'warehouse',             'is_active' => true],
            ['name' => 'North Warehouse - Buhangin',        'location_type' => 'warehouse',             'is_active' => true],
            ['name' => 'East Warehouse - Tibungco',         'location_type' => 'warehouse',             'is_active' => true],
            ['name' => 'West Warehouse - Talomo',           'location_type' => 'warehouse',             'is_active' => true],
            ['name' => 'Backup Warehouse - Panacan',        'location_type' => 'warehouse',             'is_active' => true],
            ['name' => 'Overflow Warehouse - Sasa Ext.',    'location_type' => 'warehouse',             'is_active' => true],
            ['name' => 'Old Warehouse - Bangkal',           'location_type' => 'warehouse',             'is_active' => false],

            // Retail Stores (11)
            ['name' => 'Downtown Store - Poblacion',        'location_type' => 'store',                 'is_active' => true],
            ['name' => 'Matina Store',                      'location_type' => 'store',                 'is_active' => true],
            ['name' => 'Bajada Store',                      'location_type' => 'store',                 'is_active' => true],
            ['name' => 'Ecoland Store',                     'location_type' => 'store',                 'is_active' => true],
            ['name' => 'Catalunan Store',                   'location_type' => 'store',                 'is_active' => true],
            ['name' => 'Agdao Store',                       'location_type' => 'store',                 'is_active' => true],
            ['name' => 'Buhangin Store',                    'location_type' => 'store',                 'is_active' => true],
            ['name' => 'Lanang Store',                      'location_type' => 'store',                 'is_active' => true],
            ['name' => 'Mintal Store',                      'location_type' => 'store',                 'is_active' => true],
            ['name' => 'Toril Store',                       'location_type' => 'store',                 'is_active' => true],
            ['name' => 'Closed Store - Ma-a',               'location_type' => 'store',                 'is_active' => false],

            // Distribution Centers (7)
            ['name' => 'DC Calinan',                        'location_type' => 'distribution_center',   'is_active' => true],
            ['name' => 'DC Mintal',                         'location_type' => 'distribution_center',   'is_active' => true],
            ['name' => 'DC Tibungco',                       'location_type' => 'distribution_center',   'is_active' => true],
            ['name' => 'DC Toril',                          'location_type' => 'distribution_center',   'is_active' => true],
            ['name' => 'DC Bajada',                         'location_type' => 'distribution_center',   'is_active' => true],
            ['name' => 'DC Sasa',                           'location_type' => 'distribution_center',   'is_active' => true],
            ['name' => 'DC Matina (Closed)',                'location_type' => 'distribution_center',   'is_active' => false],

            // Delivery Hubs (6)
            ['name' => 'Delivery Hub - City Proper',        'location_type' => 'delivery_hub',          'is_active' => true],
            ['name' => 'Delivery Hub - Samal Island',       'location_type' => 'delivery_hub',          'is_active' => true],
            ['name' => 'Delivery Hub - Tagum',              'location_type' => 'delivery_hub',          'is_active' => true],
            ['name' => 'Delivery Hub - Panabo',             'location_type' => 'delivery_hub',          'is_active' => true],
            ['name' => 'Delivery Hub - Digos',              'location_type' => 'delivery_hub',          'is_active' => true],
            ['name' => 'Delivery Hub - Mati (Inactive)',    'location_type' => 'delivery_hub',          'is_active' => false],

            // Service Centers (6)
            ['name' => 'Service Center - Agdao',            'location_type' => 'service_center',        'is_active' => true],
            ['name' => 'Service Center - Panacan',          'location_type' => 'service_center',        'is_active' => true],
            ['name' => 'Service Center - Talomo',           'location_type' => 'service_center',        'is_active' => true],
            ['name' => 'Service Center - Buhangin',         'location_type' => 'service_center',        'is_active' => true],
            ['name' => 'Service Center - Toril',            'location_type' => 'service_center',        'is_active' => true],
            ['name' => 'Service Center - Matina',           'location_type' => 'service_center',        'is_active' => true],

            // Cold Storage (5)
            ['name' => 'Cold Storage Unit - Sasa',          'location_type' => 'cold_storage',          'is_active' => true],
            ['name' => 'Cold Storage Unit - Lanang',        'location_type' => 'cold_storage',          'is_active' => true],
            ['name' => 'Cold Storage Unit - Matina',        'location_type' => 'cold_storage',          'is_active' => true],
            ['name' => 'Cold Storage Unit - Toril',         'location_type' => 'cold_storage',          'is_active' => true],
            ['name' => 'Cold Storage Unit - Buhangin',      'location_type' => 'cold_storage',          'is_active' => true],

            // Mobile Units (11)
            ['name' => 'Delivery Truck #1',                 'location_type' => 'mobile',                'is_active' => true],
            ['name' => 'Delivery Truck #2',                 'location_type' => 'mobile',                'is_active' => true],
            ['name' => 'Delivery Truck #3',                 'location_type' => 'mobile',                'is_active' => true],
            ['name' => 'Delivery Truck #4',                 'location_type' => 'mobile',                'is_active' => true],
            ['name' => 'Delivery Truck #5',                 'location_type' => 'mobile',                'is_active' => true],
            ['name' => 'Motorcycle Courier #1',             'location_type' => 'mobile',                'is_active' => true],
            ['name' => 'Motorcycle Courier #2',             'location_type' => 'mobile',                'is_active' => true],
            ['name' => 'Motorcycle Courier #3',             'location_type' => 'mobile',                'is_active' => true],
            ['name' => 'Motorcycle Courier #4',             'location_type' => 'mobile',                'is_active' => true],
            ['name' => 'Motorcycle Courier #5',             'location_type' => 'mobile',                'is_active' => true],
            ['name' => 'Motorcycle Courier #6 (Retired)',   'location_type' => 'mobile',                'is_active' => false],
        ];

        foreach ($locations as $location) {
            Location::create($location);
        }
    }
}