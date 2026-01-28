<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Supplier\SupplierController;
use App\Http\Controllers\Cashier\CustomerController;
use App\Http\Controllers\Cashier\SaleController;
use App\Http\Controllers\Inventory\StockController;
use App\Http\Controllers\Cashier\POSController;

Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();
        /** @var \App\Models\User $user */
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
Route::get('/login', function () {return redirect('/');});

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

        //Route::get('/POS', fn () => Inertia::render('CashierPage/POS'))->name('dash.cashier.POS');
        
        Route::get('/POS', [POSController::class, 'index'])->name('dash.cashier.POS');
        Route::post('/POS', [POSController::class, 'store'])->name('dash.cashier.POS.store');
        Route::get('/sales', [SaleController::class, 'index'])->name('dash.cashier.sales');

        Route::get('/customers', [CustomerController::class, 'index'])->name('dash.cashier.customers');
        Route::post('/customers', [CustomerController::class, 'store'])->name('dash.cashier.customers.store');
        Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('dash.cashier.customers.show');
        Route::put('/customers/{customer}', [CustomerController::class, 'update'])->name('dash.cashier.customers.update');
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->name('dash.cashier.customers.destroy');
        
    });

    Route::prefix('dashboard/accountant')->middleware('role:accountant')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Dashboard'))->name('dash.accountant');

        Route::get('/remittances', fn () => Inertia::render('AccountantPage/Remittances'))->name('dash.accountant.remittances');
        Route::get('/daily', fn () => Inertia::render('AccountantPage/DailySummary'))->name('dash.accountant.daily');
        Route::get('/payroll', fn () => Inertia::render('AccountantPage/Payroll'))->name('dash.accountant.payroll');
        Route::get('/ledger', fn () => Inertia::render('AccountantPage/Ledger'))->name('dash.accountant.ledger');
        Route::get('/reports', fn () => Inertia::render('AccountantPage/Reports'))->name('dash.accountant.reports');
    });

    Route::prefix('dashboard/rider')->middleware('role:rider')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Dashboard'))->name('dash.rider');

        Route::get('/deliveries', fn () => Inertia::render('RiderPage/MyDeliveries'))->name('dash.rider.deliveries');
        Route::get('/history', fn () => Inertia::render('RiderPage/History'))->name('dash.rider.history');
    });

    Route::prefix('dashboard/inventory')->middleware('role:inventory_manager')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Dashboard'))->name('dash.inventory');

        // Stock Management
        Route::get('/counts', [StockController::class, 'stockCount'])->name('dash.inventory.counts');
        Route::post('/counts/{inventoryBalance}/adjust', [StockController::class, 'update'])->name('dash.inventory.counts.update');
        Route::get('/low-stock', [StockController::class, 'lowStock'])->name('dash.inventory.lowstock');
    

        // Other Inventory Pages
        Route::get('/movements', [StockController::class, 'movements'])->name('dash.inventory.movements');
        Route::get('/purchases', fn () => Inertia::render('InventoryPage/Purchases'))->name('dash.inventory.purchases');
        Route::get('/suppliers', [SupplierController::class, 'index'])->name('dash.inventory.suppliers');
        Route::get('/suppliers', [SupplierController::class, 'index'])->name('dash.inventory.suppliers');
    });

});
