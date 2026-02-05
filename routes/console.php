<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use App\Models\InventoryBalance;
use App\Models\StockCount;
use App\Models\ProductVariant;
use App\Models\Location;
use Spatie\Permission\PermissionRegistrar;
use App\Models\Role;
use App\Models\User;
use Spatie\Permission\Models\Permission;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('inventory:recalculate-balances {--reset-counts}', function () {
    $resetCounts = (bool) $this->option('reset-counts');

    if ($resetCounts) {
        StockCount::truncate();
        $this->comment('Stock counts cleared.');
    }

    $locations = Location::all();
    $variants = ProductVariant::all();

    if ($locations->isEmpty() || $variants->isEmpty()) {
        $this->error('No locations or product variants found.');
        return;
    }

    $movements = DB::table('stock_movements')
        ->select('location_id', 'product_variant_id', DB::raw('SUM(qty) as on_hand'))
        ->groupBy('location_id', 'product_variant_id')
        ->get()
        ->keyBy(fn ($r) => $r->location_id . '::' . $r->product_variant_id);

    foreach ($locations as $location) {
        foreach ($variants as $variant) {
            $key = $location->id . '::' . $variant->id;
            $onHand = (int) round((float) ($movements[$key]->on_hand ?? 0));

            $existing = InventoryBalance::where('location_id', $location->id)
                ->where('product_variant_id', $variant->id)
                ->first();

            InventoryBalance::updateOrCreate(
                [
                    'location_id' => $location->id,
                    'product_variant_id' => $variant->id,
                ],
                [
                    'qty_filled' => $onHand,
                    'qty_empty' => 0,
                    'qty_reserved' => $existing?->qty_reserved ?? 0,
                    'reorder_level' => $existing?->reorder_level ?? 0,
                ]
            );
        }
    }

    $this->info('Inventory balances recalculated from stock movements.');
})->purpose('Recalculate inventory balances from stock movements (use --reset-counts to clear stock counts).');

Artisan::command('pietyl:ensure-admin-access', function () {
    $guard = config('auth.defaults.guard', 'web');

    $this->comment('Ensuring admin role and user keep full access.');

    $role = Role::where('name', 'admin')->first();
    if (!$role) {
        $this->error('The admin role does not exist.');
        return;
    }

    $permissions = Permission::where('guard_name', $guard)->get();
    if ($permissions->isEmpty()) {
        $this->warn('No permissions found for guard '.$guard.'.');
    }

    $role->syncPermissions($permissions);
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    $this->info(sprintf('Admin role synced with %d permissions.', $permissions->count()));

    $user = User::where('email', 'admin@pietyl.test')->first();
    if (!$user) {
        $this->error('admin@pietyl.test user is not present.');
        return;
    }

    $user->syncRoles([$role]);
    $this->info('admin@pietyl.test is confirmed to have the admin role assigned.');
})->purpose('Restore full permissions to the system admin account and role.');
