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
            // Admin (1)
            ['email' => 'admin@pietyl.test',                'role' => 'admin',             'name' => 'System Admin'],

            // Cashiers (14)
            ['email' => 'cashier@pietyl.test',              'role' => 'cashier',           'name' => 'Test Cashier'],
            ['email' => 'liza.santos@pietyl.test',          'role' => 'cashier',           'name' => 'Liza Santos'],
            ['email' => 'rona.cruz@pietyl.test',            'role' => 'cashier',           'name' => 'Rona Cruz'],
            ['email' => 'edgar.bautista@pietyl.test',       'role' => 'cashier',           'name' => 'Edgar Bautista'],
            ['email' => 'nelia.fernandez@pietyl.test',      'role' => 'cashier',           'name' => 'Nelia Fernandez'],
            ['email' => 'jomar.villanueva@pietyl.test',     'role' => 'cashier',           'name' => 'Jomar Villanueva'],
            ['email' => 'alma.pascual@pietyl.test',         'role' => 'cashier',           'name' => 'Alma Pascual'],
            ['email' => 'dante.ocampo@pietyl.test',         'role' => 'cashier',           'name' => 'Dante Ocampo'],
            ['email' => 'precy.manalo@pietyl.test',         'role' => 'cashier',           'name' => 'Precy Manalo'],
            ['email' => 'gerry.delacruz@pietyl.test',       'role' => 'cashier',           'name' => 'Gerry Dela Cruz'],
            ['email' => 'rowena.santos@pietyl.test',        'role' => 'cashier',           'name' => 'Rowena Santos'],
            ['email' => 'freddie.ramos@pietyl.test',        'role' => 'cashier',           'name' => 'Freddie Ramos'],
            ['email' => 'nora.aquino@pietyl.test',          'role' => 'cashier',           'name' => 'Nora Aquino'],
            ['email' => 'joel.garcia@pietyl.test',          'role' => 'cashier',           'name' => 'Joel Garcia'],

            // Accountants (5)
            ['email' => 'accountant@pietyl.test',           'role' => 'accountant',        'name' => 'Test Accountant'],
            ['email' => 'carmen.torres@pietyl.test',        'role' => 'accountant',        'name' => 'Carmen Torres'],
            ['email' => 'rodolfo.navarro@pietyl.test',      'role' => 'accountant',        'name' => 'Rodolfo Navarro'],
            ['email' => 'patricia.borja@pietyl.test',       'role' => 'accountant',        'name' => 'Patricia Borja'],
            ['email' => 'samuel.aquino@pietyl.test',        'role' => 'accountant',        'name' => 'Samuel Aquino'],

            // Riders (22)
            ['email' => 'rider@pietyl.test',                'role' => 'rider',             'name' => 'Test Rider 1'],
            ['email' => 'rider2@pietyl.test',               'role' => 'rider',             'name' => 'Test Rider 2'],
            ['email' => 'rider3@pietyl.test',               'role' => 'rider',             'name' => 'Test Rider 3'],
            ['email' => 'rolando.macaraeg@pietyl.test',     'role' => 'rider',             'name' => 'Rolando Macaraeg'],
            ['email' => 'efren.soriano@pietyl.test',        'role' => 'rider',             'name' => 'Efren Soriano'],
            ['email' => 'ernesto.cabrera@pietyl.test',      'role' => 'rider',             'name' => 'Ernesto Cabrera'],
            ['email' => 'noel.gutierrez@pietyl.test',       'role' => 'rider',             'name' => 'Noel Gutierrez'],
            ['email' => 'marco.ignacio@pietyl.test',        'role' => 'rider',             'name' => 'Marco Ignacio'],
            ['email' => 'aldo.espiritu@pietyl.test',        'role' => 'rider',             'name' => 'Aldo Espiritu'],
            ['email' => 'ramon.valdez@pietyl.test',         'role' => 'rider',             'name' => 'Ramon Valdez'],
            ['email' => 'jun.mendez@pietyl.test',           'role' => 'rider',             'name' => 'Jun Mendez'],
            ['email' => 'ariel.flores@pietyl.test',         'role' => 'rider',             'name' => 'Ariel Flores'],
            ['email' => 'dante.reyes@pietyl.test',          'role' => 'rider',             'name' => 'Dante Reyes'],
            ['email' => 'benjie.castillo@pietyl.test',      'role' => 'rider',             'name' => 'Benjie Castillo'],
            ['email' => 'rodel.aquino@pietyl.test',         'role' => 'rider',             'name' => 'Rodel Aquino'],
            ['email' => 'sonny.borja@pietyl.test',          'role' => 'rider',             'name' => 'Sonny Borja'],
            ['email' => 'willy.paglinawan@pietyl.test',     'role' => 'rider',             'name' => 'Willy Paglinawan'],
            ['email' => 'danny.evangelista@pietyl.test',    'role' => 'rider',             'name' => 'Danny Evangelista'],
            ['email' => 'cesar.villafuerte@pietyl.test',    'role' => 'rider',             'name' => 'Cesar Villafuerte'],
            ['email' => 'ronnie.deguzman@pietyl.test',      'role' => 'rider',             'name' => 'Ronnie De Guzman'],
            ['email' => 'lito.banares@pietyl.test',         'role' => 'rider',             'name' => 'Lito Banares'],
            ['email' => 'raffy.andrade@pietyl.test',        'role' => 'rider',             'name' => 'Raffy Andrade'],

            // Inventory Managers (8)
            ['email' => 'inventory@pietyl.test',            'role' => 'inventory_manager', 'name' => 'Inventory Manager'],
            ['email' => 'diana.alcantara@pietyl.test',      'role' => 'inventory_manager', 'name' => 'Diana Alcantara'],
            ['email' => 'bernard.lim@pietyl.test',          'role' => 'inventory_manager', 'name' => 'Bernard Lim'],
            ['email' => 'cora.manalo@pietyl.test',          'role' => 'inventory_manager', 'name' => 'Cora Manalo'],
            ['email' => 'nonoy.andrade@pietyl.test',        'role' => 'inventory_manager', 'name' => 'Nonoy Andrade'],
            ['email' => 'ferdie.valenzuela@pietyl.test',    'role' => 'inventory_manager', 'name' => 'Ferdie Valenzuela'],
            ['email' => 'mylene.deguzman@pietyl.test',      'role' => 'inventory_manager', 'name' => 'Mylene De Guzman'],
            ['email' => 'joey.alcantara@pietyl.test',       'role' => 'inventory_manager', 'name' => 'Joey Alcantara'],
        ];

        // Track per-role counters so every employee_no is unique
        $roleCounters = [];

        // Prefix map — keeps codes short and readable
        $rolePrefix = [
            'admin'             => 'ADMIN',
            'cashier'           => 'CASH',
            'accountant'        => 'ACCT',
            'rider'             => 'RIDER',
            'inventory_manager' => 'INV',
        ];

        foreach ($users as $u) {
            $prefix = $rolePrefix[$u['role']] ?? strtoupper($u['role']);

            if (!isset($roleCounters[$prefix])) {
                $roleCounters[$prefix] = 1;
            }

            $employeeNo = $prefix . '-' . str_pad($roleCounters[$prefix], 3, '0', STR_PAD_LEFT);
            $roleCounters[$prefix]++;

            $employee = DB::table('employees')->where('email', $u['email'])->first();
            if (!$employee) {
                $employeeId = DB::table('employees')->insertGetId([
                    'employee_no' => $employeeNo,
                    'first_name'  => $u['name'],
                    'last_name'   => 'User',
                    'email'       => $u['email'],
                    'status'      => 'active',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            } else {
                DB::table('employees')->where('id', $employee->id)->update([
                    'employee_no' => $employeeNo,
                    'first_name'  => $u['name'],
                    'last_name'   => 'User',
                    'status'      => 'active',
                    'updated_at'  => now(),
                ]);
                $employeeId = $employee->id;
            }

            $user = DB::table('users')->where('email', $u['email'])->first();
            if (!$user) {
                $userId = DB::table('users')->insertGetId([
                    'name'        => $u['name'],
                    'email'       => $u['email'],
                    'password'    => Hash::make('password'),
                    'employee_id' => $employeeId,
                    'is_active'   => 1,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            } else {
                DB::table('users')->where('id', $user->id)->update([
                    'name'        => $u['name'],
                    'employee_id' => $employeeId,
                    'is_active'   => 1,
                    'updated_at'  => now(),
                ]);
                $userId = $user->id;
            }

            DB::table('employees')->where('id', $employeeId)->update([
                'user_id'    => $userId,
                'updated_at' => now(),
            ]);

            $roleId = DB::table('roles')->where('name', $u['role'])->value('id');
            if ($roleId) {
                DB::table('model_has_roles')->updateOrInsert(
                    [
                        'role_id'    => $roleId,
                        'model_type' => \App\Models\User::class,
                        'model_id'   => $userId,
                    ],
                    [
                        'role_id'    => $roleId,
                        'model_type' => \App\Models\User::class,
                        'model_id'   => $userId,
                    ]
                );
            }
        }
    }
}