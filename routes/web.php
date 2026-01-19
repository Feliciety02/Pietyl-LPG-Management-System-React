<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\SupplierController;

Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();
        $role = $user->roles()->first()?->name;

        return redirect(match ($role) {
            'admin' => '/dashboard/admin',
            'cashier' => '/dashboard/cashier',
            'accountant' => '/dashboard/accountant',
            'rider' => '/dashboard/rider',
            'inventory_manager' => '/dashboard/inventory',
            default => '/',
        });
    }

    return Inertia::render('LandingPage');
})->name('home');

Route::post('/login', [LoginController::class, 'store'])->name('login');
Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

Route::middleware(['auth'])->group(function () {

    Route::prefix('dashboard/admin')->middleware('role:admin')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Dashboard'))->name('dash.admin');

        Route::get('/users', fn () => Inertia::render('AdminPage/Users'))->name('dash.admin.users');
        Route::get('/employees', fn () => Inertia::render('AdminPage/Employees'))->name('dash.admin.employees');
        Route::get('/customers', fn () => Inertia::render('CashierPage/Customers'))->name('dash.admin.customer');  
        Route::get('/roles', fn () => Inertia::render('AdminPage/Roles'))->name('dash.admin.roles');
        Route::get('/audit', fn () => Inertia::render('AdminPage/AuditLogs'))->name('dash.admin.audit');
        Route::get('/reports', fn () => Inertia::render('AdminPage/Reports'))->name('dash.admin.reports');
        Route::get('/suppliers', fn () => Inertia::render('AdminPage/Suppliers'))->name('dash.admin.suppliers');
        Route::get('/products', fn () => Inertia::render('AdminPage/Products'))->name('dash.admin.products');
    });

    Route::prefix('dashboard/cashier')->middleware('role:cashier')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Dashboard'))->name('dash.cashier');

        Route::get('/POS', fn () => Inertia::render('CashierPage/POS'))->name('dash.cashier.POS');
        Route::get('/sales', fn () => Inertia::render('CashierPage/Sales'))->name('dash.cashier.sales');
        Route::get('/customers', fn () => Inertia::render('CashierPage/Customers'))->name('dash.cashier.customers');
    });

    Route::prefix('dashboard/accountant')->middleware('role:accountant')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Dashboard'))->name('dash.accountant');

        Route::get('/remittances', fn () => Inertia::render('AccountantPage/Remittances'))->name('dash.accountant.remittances');
        Route::get('/daily', fn () => Inertia::render('AccountantPage/DailySummary'))->name('dash.accountant.daily');
        Route::get('/ledger', fn () => Inertia::render('AccountantPage/Ledger'))->name('dash.accountant.ledger');
        Route::get('/reports', fn () => Inertia::render('AccountantPage/Reports'))->name('dash.accountant.reports');
    });

    Route::prefix('dashboard/rider')->middleware('role:rider')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Dashboard'))->name('dash.rider');

        Route::get('/deliveries', fn () => Inertia::render('RiderPage/MyDeliveries'))->name('dash.rider.deliveries');
        Route::get('/status', fn () => Inertia::render('RiderPage/StatusUpdates'))->name('dash.rider.status');
        Route::get('/remittance', fn () => Inertia::render('RiderPage/Remittance'))->name('dash.rider.remittance');
        Route::get('/history', fn () => Inertia::render('RiderPage/History'))->name('dash.rider.history');
    });

    Route::prefix('dashboard/inventory')->middleware('role:inventory_manager')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Dashboard'))->name('dash.inventory');

        Route::get('/counts', fn () => Inertia::render('InventoryPage/StockCounts'))->name('dash.inventory.counts');
        Route::get('/movements', fn () => Inertia::render('InventoryPage/Movements'))->name('dash.inventory.movements');
        Route::get('/low-stock', fn () => Inertia::render('InventoryPage/LowStock'))->name('dash.inventory.lowstock');
        Route::get('/purchases', fn () => Inertia::render('InventoryPage/Purchases'))->name('dash.inventory.purchases');
        Route::get('/suppliers', [SupplierController::class, 'index'])->name('dash.inventory.suppliers');
    });

});
