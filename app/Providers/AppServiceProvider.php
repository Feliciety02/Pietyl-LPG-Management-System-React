<?php

namespace App\Providers;

use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Delivery;
use App\Models\Employee;
use App\Models\InventoryBalance;
use App\Models\Location;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Receipt;
use App\Models\RestockRequest;
use App\Models\RestockRequestItem;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Models\UserRole;
use App\Observers\AuditTrailObserver;
use App\Services\SettingsService;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Permission;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(SettingsService::class, function () {
            return new SettingsService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // One-off safety net: ensure inventory_manager always has low stock permission.
        try {
            $role = Role::where('name', 'inventory_manager')->first();
            if ($role && !$role->hasPermissionTo('inventory.stock.low_stock')) {
                $perm = Permission::firstOrCreate(
                    ['name' => 'inventory.stock.low_stock', 'guard_name' => 'web']
                );
                $role->givePermissionTo($perm);
            }
        } catch (\Throwable $e) {
            // Fail silently to avoid breaking boot if permissions aren't ready yet.
        }

        Gate::before(function ($user) {
            return $user->hasRole('admin') ? true : null;
        });

        $models = [
            User::class,
            UserRole::class,
            Role::class,
            Employee::class,
            Customer::class,
            CustomerAddress::class,
            Supplier::class,
            SupplierProduct::class,
            Product::class,
            ProductVariant::class,
            InventoryBalance::class,
            StockMovement::class,
            Purchase::class,
            PurchaseItem::class,
            RestockRequest::class,
            RestockRequestItem::class,
            Sale::class,
            SaleItem::class,
            Payment::class,
            PaymentMethod::class,
            Receipt::class,
            Delivery::class,
            Location::class,
        ];

        foreach ($models as $model) {
            $model::observe(AuditTrailObserver::class);
        }
    }
}
