<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use App\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $guard = 'web';

        $permissions = [
            // Admin
            'admin.users.view',
            'admin.users.create',
            'admin.users.update',
            'admin.users.archive',
            'admin.roles.view',
            'admin.roles.create',
            'admin.roles.update',
            'admin.roles.archive',
            'admin.roles.permissions',
            'admin.roles.restore',
            'admin.employees.view',
            'admin.employees.create',
            'admin.employees.update',
            'admin.employees.archive',
            'admin.customers.view',
            'admin.audit.view',
            'admin.reports.view',
            'admin.reports.export',
            'admin.suppliers.view',
            'admin.suppliers.create',
            'admin.suppliers.update',
            'admin.suppliers.archive',
            'admin.products.view',
            'admin.products.create',
            'admin.products.update',
            'admin.products.archive',

            // Cashier
            'cashier.pos.use',
            'cashier.sales.view',
            'cashier.sales.create',
            'cashier.customers.view',
            'cashier.customers.create',
            'cashier.customers.update',
            'cashier.customers.delete',
            'cashier.audit.view',

            // Inventory
            'inventory.stock.view',
            'inventory.stock.adjust',
            'inventory.stock.low_stock',
            'inventory.movements.view',
            'inventory.purchases.view',
            'inventory.purchases.create',
            'inventory.purchases.update',
            'inventory.suppliers.view',
            'inventory.suppliers.create',
            'inventory.suppliers.update',
            'inventory.suppliers.archive',
            'inventory.products.view',
            'inventory.products.create',
            'inventory.products.update',
            'inventory.products.archive',
            'inventory.audit.view',

            // Accountant
            'accountant.remittances.view',
            'accountant.remittances.verify',
            'accountant.daily.view',
            'accountant.payroll.view',
            'accountant.ledger.view',
            'accountant.reports.view',
            'accountant.audit.view',

            // Rider
            'rider.deliveries.view',
            'rider.deliveries.update',
            'rider.history.view',
            'rider.audit.view',
        ];

        foreach ($permissions as $name) {
            Permission::findOrCreate($name, $guard);
        }

        $all = Permission::where('guard_name', $guard)->get();

        $rolePermissions = [
            'admin' => $all,
            'cashier' => $all->filter(fn ($p) => str_starts_with($p->name, 'cashier.')),
            'inventory_manager' => $all->filter(fn ($p) => str_starts_with($p->name, 'inventory.')),
            'accountant' => $all->filter(fn ($p) => str_starts_with($p->name, 'accountant.')),
            'rider' => $all->filter(fn ($p) => str_starts_with($p->name, 'rider.')),
        ];

        foreach ($rolePermissions as $roleName => $perms) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->syncPermissions($perms);
            }
        }
    }
}
