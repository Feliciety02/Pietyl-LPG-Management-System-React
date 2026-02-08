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
            'admin.customers.create',
            'admin.customers.update',
            'admin.customers.delete',
            'admin.audit.view',
            'admin.settings.manage',
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
            'inventory.thresholds.view',
            'inventory.purchase_requests.low_stock',
            'inventory.movements.view',
            'inventory.purchases.view',
            'inventory.purchase_requests.view',
            'inventory.purchase_requests.create',
            'inventory.purchase_requests.submit',
            'inventory.purchase_requests.receive',
            'inventory.purchases.create',
            'inventory.purchases.update',
            'inventory.purchases.confirm',
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
            'accountant.purchase_requests.view',
            'accountant.purchase_requests.export',
            'accountant.daily.view',
            'accountant.payables.view',
            'accountant.payables.pay',
            'accountant.payroll.view',
            'accountant.ledger.view',
            'accountant.reports.view',
            'accountant.audit.view',

            // Admin
            'admin.purchase_requests.view',
            'admin.purchase_requests.approve',
            'admin.purchase_requests.reject',
            'admin.purchase_requests.contact_supplier',
            'admin.purchase_requests.cancel',

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
