<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Auth\LoginController;

Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();
        $role = $user->roles->first()?->name;

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
        Route::get('/', fn () => Inertia::render('AdminPage/Dashboard'))->name('dash.admin');

        Route::get('/users', fn () => Inertia::render('AdminPage/Tabs/Users'))->name('dash.admin.users');
        Route::get('/employees', fn () => Inertia::render('AdminPage/Tabs/Employees'))->name('dash.admin.employees');
        Route::get('/roles', fn () => Inertia::render('AdminPage/Tabs/Roles'))->name('dash.admin.roles');
        Route::get('/audit', fn () => Inertia::render('AdminPage/Tabs/AuditLogs'))->name('dash.admin.audit');
        Route::get('/reports', fn () => Inertia::render('AdminPage/Tabs/Reports'))->name('dash.admin.reports');
    });

    Route::prefix('dashboard/cashier')->middleware('role:cashier')->group(function () {
        Route::get('/', fn () => Inertia::render('CashierPage/Dashboard'))->name('dash.cashier');

        Route::get('/new-sale', fn () => Inertia::render('CashierPage/Tabs/NewSale'))->name('dash.cashier.newsale');
        Route::get('/transactions', fn () => Inertia::render('CashierPage/Tabs/Transactions'))->name('dash.cashier.transactions');
        Route::get('/refill-swap', fn () => Inertia::render('CashierPage/Tabs/RefillSwap'))->name('dash.cashier.refillswap');
        Route::get('/customers', fn () => Inertia::render('CashierPage/Tabs/Customers'))->name('dash.cashier.customers');
        Route::get('/payments', fn () => Inertia::render('CashierPage/Tabs/Payments'))->name('dash.cashier.payments');
    });

    Route::prefix('dashboard/accountant')->middleware('role:accountant')->group(function () {
        Route::get('/', fn () => Inertia::render('AccountantPage/Dashboard'))->name('dash.accountant');

        Route::get('/remittances', fn () => Inertia::render('AccountantPage/Tabs/Remittances'))->name('dash.accountant.remittances');
        Route::get('/daily', fn () => Inertia::render('AccountantPage/Tabs/DailySummary'))->name('dash.accountant.daily');
        Route::get('/ledger', fn () => Inertia::render('AccountantPage/Tabs/Ledger'))->name('dash.accountant.ledger');
        Route::get('/reports', fn () => Inertia::render('AccountantPage/Tabs/Reports'))->name('dash.accountant.reports');
    });

    Route::prefix('dashboard/rider')->middleware('role:rider')->group(function () {
        Route::get('/', fn () => Inertia::render('RiderPage/Dashboard'))->name('dash.rider');

        Route::get('/deliveries', fn () => Inertia::render('RiderPage/Tabs/MyDeliveries'))->name('dash.rider.deliveries');
        Route::get('/status', fn () => Inertia::render('RiderPage/Tabs/StatusUpdates'))->name('dash.rider.status');
        Route::get('/remittance', fn () => Inertia::render('RiderPage/Tabs/Remittance'))->name('dash.rider.remittance');
        Route::get('/history', fn () => Inertia::render('RiderPage/Tabs/History'))->name('dash.rider.history');
    });

    Route::prefix('dashboard/inventory')->middleware('role:inventory_manager')->group(function () {
        Route::get('/', fn () => Inertia::render('InventoryPage/Dashboard'))->name('dash.inventory');

        Route::get('/counts', fn () => Inertia::render('InventoryPage/Tabs/StockCounts'))->name('dash.inventory.counts');
        Route::get('/movements', fn () => Inertia::render('InventoryPage/Tabs/Movements'))->name('dash.inventory.movements');
        Route::get('/low-stock', fn () => Inertia::render('InventoryPage/Tabs/LowStock'))->name('dash.inventory.lowstock');
        Route::get('/purchases', fn () => Inertia::render('InventoryPage/Tabs/Purchases'))->name('dash.inventory.purchases');
        Route::get('/suppliers', fn () => Inertia::render('InventoryPage/Tabs/Suppliers'))->name('dash.inventory.suppliers');
    });

});
