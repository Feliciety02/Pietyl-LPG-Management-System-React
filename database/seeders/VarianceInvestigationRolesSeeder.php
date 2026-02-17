<?php

namespace Database\Seeders;

use Spatie\Permission\Models\Role;
use Illuminate\Database\Seeder;

class VarianceInvestigationRolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles for variance investigation workflow if they don't exist
        $roles = [
            ['name' => 'warehouse_manager', 'guard_name' => 'web', 'description' => 'Manages warehouse operations and conducts physical investigations'],
            ['name' => 'operations_manager', 'guard_name' => 'web', 'description' => 'Oversees inventory operations and approves investigations'],
            ['name' => 'finance_manager', 'guard_name' => 'web', 'description' => 'Reviews financial impact of variances and approves write-offs'],
            ['name' => 'inventory_manager', 'guard_name' => 'web', 'description' => 'Manages inventory system and conducts investigations'],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );
        }

        echo "Variance investigation roles seeded successfully.\n";
    }
}
