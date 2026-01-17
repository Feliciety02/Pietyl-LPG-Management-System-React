<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('roles')->insert([
            [
                'name' => 'admin',
                'description' => 'Full system access',
            ],
            [
                'name' => 'cashier',
                'description' => 'Sales, refills, swaps, and payments',
            ],
            [
                'name' => 'accountant',
                'description' => 'Accounting, reports, and remittances',
            ],
            [
                'name' => 'rider',
                'description' => 'Delivery, status updates, and remittance',
            ],
            [
                'name' => 'inventory_manager',
                'description' => 'Inventory tracking and purchasing',
            ],
        ]);
    }
}
