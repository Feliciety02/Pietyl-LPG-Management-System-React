<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'email' => 'admin@pietyl.test',
                'role' => 'admin',
                'name' => 'System Admin',
            ],
            [
                'email' => 'cashier@pietyl.test',
                'role' => 'cashier',
                'name' => 'Test Cashier',
            ],
            [
                'email' => 'accountant@pietyl.test',
                'role' => 'accountant',
                'name' => 'Test Accountant',
            ],
            [
                'email' => 'rider@pietyl.test',
                'role' => 'rider',
                'name' => 'Test Rider',
            ],
            [
                'email' => 'inventory@pietyl.test',
                'role' => 'inventory_manager',
                'name' => 'Inventory Manager',
            ],
        ];

        foreach ($users as $u) {
            // create employee
            $employeeId = DB::table('employees')->insertGetId([
                'employee_no' => strtoupper($u['role']) . '-001',
                'first_name' => $u['name'],
                'last_name' => 'User',
                'status' => 'active',
            ]);

            // create user
            $userId = DB::table('users')->insertGetId([
                'employee_id' => $employeeId,
                'email' => $u['email'],
                'password' => Hash::make('password'),
                'is_active' => 1,
            ]);

            // assign role
            DB::table('user_roles')->insert([
                'user_id' => $userId,
                'role_id' => DB::table('roles')->where('name', $u['role'])->value('id'),
            ]);
        }
    }
}
