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
            $employee = DB::table('employees')->where('email', $u['email'])->first();
            if (!$employee) {
                $employeeId = DB::table('employees')->insertGetId([
                    'employee_no' => strtoupper($u['role']) . '-001',
                    'first_name' => $u['name'],
                    'last_name' => 'User',
                    'email' => $u['email'],
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('employees')->where('id', $employee->id)->update([
                    'employee_no' => strtoupper($u['role']) . '-001',
                    'first_name' => $u['name'],
                    'last_name' => 'User',
                    'status' => 'active',
                    'updated_at' => now(),
                ]);
                $employeeId = $employee->id;
            }

            $user = DB::table('users')->where('email', $u['email'])->first();
            if (!$user) {
                $userId = DB::table('users')->insertGetId([
                    'name' => $u['name'],
                    'email' => $u['email'],
                    'password' => Hash::make('password'),
                    'employee_id' => $employeeId,
                    'is_active' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('users')->where('id', $user->id)->update([
                    'name' => $u['name'],
                    'employee_id' => $employeeId,
                    'is_active' => 1,
                    'updated_at' => now(),
                ]);
                $userId = $user->id;
            }

            DB::table('employees')->where('id', $employeeId)->update([
                'user_id' => $userId,
                'updated_at' => now(),
            ]);

            $roleId = DB::table('roles')->where('name', $u['role'])->value('id');
            if ($roleId) {
                DB::table('model_has_roles')->updateOrInsert(
                    [
                        'role_id' => $roleId,
                        'model_type' => \App\Models\User::class,
                        'model_id' => $userId,
                    ],
                    [
                        'role_id' => $roleId,
                        'model_type' => \App\Models\User::class,
                        'model_id' => $userId,
                    ]
                );
            }
        }
    }
}
