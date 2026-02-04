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
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Inventory\PurchaseController;
use App\Http\Controllers\Inventory\RestockRequestController;
use App\Http\Controllers\Accountant\RemittanceController as AccountantRemittanceController;
use App\Http\Controllers\Accountant\DailySummaryController as AccountantDailySummaryController;
use App\Http\Controllers\Accountant\LedgerController as AccountantLedgerController;
use App\Http\Controllers\Accountant\ReportController as AccountantReportController;

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

        Route::get('/users', [UserController::class, 'index'])
            ->middleware('permission:admin.users.view')
            ->name('dash.admin.users');
        Route::post('/users', [UserController::class, 'store'])
            ->middleware('permission:admin.users.create')
            ->name('dash.admin.users.store');
        Route::post('/password/confirm', [UserController::class, 'confirmPassword'])
            ->middleware(['permission:admin.users.update', 'throttle:10,1'])
            ->name('dash.admin.password.confirm');
        Route::get('/employees', [EmployeeController::class, 'index'])
            ->middleware('permission:admin.employees.view')
            ->name('dash.admin.employees');
        Route::post('/employees', [EmployeeController::class, 'store'])
            ->middleware('permission:admin.employees.create')
            ->name('dash.admin.employees.store');
        Route::put('/employees/{employee}', [EmployeeController::class, 'update'])
            ->middleware('permission:admin.employees.update')
            ->name('dash.admin.employees.update');
        Route::post('/employees/{employee}/link-user', [EmployeeController::class, 'linkUser'])
            ->middleware('permission:admin.employees.update')
            ->name('dash.admin.employees.link-user');
        Route::delete('/employees/{employee}/unlink-user', [EmployeeController::class, 'unlinkUser'])
            ->middleware('permission:admin.employees.update')
            ->name('dash.admin.employees.unlink-user');
        Route::get('/customers', fn () => Inertia::render('CashierPage/Customers'))
            ->middleware('permission:admin.customers.view')
            ->name('dash.admin.customer');  
        Route::get('/roles', [RoleController::class, 'index'])
            ->middleware('permission:admin.roles.view')
            ->name('dash.admin.roles');
        Route::post('/roles', [RoleController::class, 'store'])
            ->middleware('permission:admin.roles.create')
            ->name('dash.admin.roles.store');
        Route::put('/roles/{role}', [RoleController::class, 'update'])
            ->middleware('permission:admin.roles.update')
            ->name('dash.admin.roles.update');
        Route::put('/roles/{role}/permissions', [RoleController::class, 'updatePermissions'])
            ->middleware('permission:admin.roles.permissions')
            ->name('dash.admin.roles.permissions');
        Route::post('/roles/{role}/archive', [RoleController::class, 'archive'])
            ->middleware('permission:admin.roles.archive')
            ->name('dash.admin.roles.archive');
        Route::put('/roles/{role}/restore', [RoleController::class, 'restore'])
            ->middleware('permission:admin.roles.restore')
            ->name('dash.admin.roles.restore');
        Route::get('/audit', [AuditLogController::class, 'index'])
            ->middleware('permission:admin.audit.view')
            ->name('dash.admin.audit');
        Route::get('/reports', fn () => Inertia::render('AdminPage/Reports'))
            ->middleware('permission:admin.reports.view')
            ->name('dash.admin.reports');
        Route::get('/suppliers', [SupplierController::class, 'index'])
            ->middleware('permission:admin.suppliers.view')
            ->name('dash.admin.suppliers');
        Route::post('/suppliers', [SupplierController::class, 'store'])
            ->middleware('permission:admin.suppliers.create')
            ->name('dash.admin.suppliers.store');
        Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])
            ->middleware('permission:admin.suppliers.update')
            ->name('dash.admin.suppliers.update');
        Route::post('/suppliers/{supplier}/archive', [SupplierController::class, 'archive'])
            ->middleware('permission:admin.suppliers.archive')
            ->name('dash.admin.suppliers.archive');
        Route::put('/suppliers/{supplier}/restore', [SupplierController::class, 'restore'])
            ->middleware('permission:admin.suppliers.archive')
            ->name('dash.admin.suppliers.restore');
        Route::get('/products', [ProductController::class, 'index'])
            ->middleware('permission:admin.products.view')
            ->name('dash.admin.products');
        Route::post('/products', [ProductController::class, 'store'])
            ->middleware('permission:admin.products.create')
            ->name('dash.admin.products.store');
        Route::put('/products/{product}', [ProductController::class, 'update'])
            ->middleware('permission:admin.products.update')
            ->name('dash.admin.products.update');
        Route::post('/products/{product}/archive', [ProductController::class, 'archive'])
            ->middleware('permission:admin.products.archive')
            ->name('dash.admin.products.archive');
        Route::put('/products/{product}/restore', [ProductController::class, 'restore'])
            ->middleware('permission:admin.products.archive')
            ->name('dash.admin.products.restore');

        Route::post('/purchase-requests/{id}/approve', [RestockRequestController::class, 'approve'])
            ->middleware('permission:inventory.purchases.update')
            ->name('dash.admin.purchase-requests.approve');
        Route::post('/purchase-requests/{id}/reject', [RestockRequestController::class, 'reject'])
            ->middleware('permission:inventory.purchases.update')
            ->name('dash.admin.purchase-requests.reject');

        Route::get('/stock-requests', [RestockRequestController::class, 'adminIndex'])
            ->middleware('permission:inventory.purchases.view')
            ->name('dash.admin.stock-requests');
    });

    Route::prefix('dashboard/cashier')->middleware('role:cashier')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Dashboard'))->name('dash.cashier');

        //Route::get('/POS', fn () => Inertia::render('CashierPage/POS'))->name('dash.cashier.POS');
        
        Route::get('/POS', [POSController::class, 'index'])
            ->middleware('permission:cashier.pos.use')
            ->name('dash.cashier.POS');
        Route::post('/POS', [POSController::class, 'store'])
            ->middleware('permission:cashier.sales.create')
            ->name('dash.cashier.POS.store');
        Route::get('/sales', [SaleController::class, 'index'])
            ->middleware('permission:cashier.sales.view')
            ->name('dash.cashier.sales');
        Route::get('/sales/latest', [SaleController::class, 'latest'])
            ->middleware('permission:cashier.sales.view')
            ->name('dash.cashier.sales.latest');
        Route::get('/audit', [AuditLogController::class, 'index'])
            ->middleware('permission:cashier.audit.view')
            ->name('dash.cashier.audit');

        Route::get('/customers', [CustomerController::class, 'index'])
            ->middleware('permission:cashier.customers.view')
            ->name('dash.cashier.customers');
        Route::post('/customers', [CustomerController::class, 'store'])
            ->middleware('permission:cashier.customers.create')
            ->name('dash.cashier.customers.store');
        Route::get('/customers/{customer}', [CustomerController::class, 'show'])
            ->middleware('permission:cashier.customers.view')
            ->name('dash.cashier.customers.show');
        Route::put('/customers/{customer}', [CustomerController::class, 'update'])
            ->middleware('permission:cashier.customers.update')
            ->name('dash.cashier.customers.update');
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])
            ->middleware('permission:cashier.customers.delete')
            ->name('dash.cashier.customers.destroy');
        
    });

    Route::prefix('dashboard/accountant')->middleware('role:accountant')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Dashboard'))->name('dash.accountant');

        Route::get('/remittances', [AccountantRemittanceController::class, 'index'])
            ->middleware('permission:accountant.remittances.view')
            ->name('dash.accountant.remittances');
        Route::post('/remittances/record', [AccountantRemittanceController::class, 'record'])
            ->middleware('permission:accountant.remittances.verify')
            ->name('dash.accountant.remittances.record');

        Route::get('/daily', [AccountantDailySummaryController::class, 'index'])
            ->middleware('permission:accountant.daily.view')
            ->name('dash.accountant.daily');
        Route::post('/daily/finalize', [AccountantDailySummaryController::class, 'finalize'])
            ->middleware('permission:accountant.daily.view')
            ->name('dash.accountant.daily.finalize');

        Route::get('/payroll', fn () => Inertia::render('AccountantPage/Payroll'))
            ->middleware('permission:accountant.payroll.view')
            ->name('dash.accountant.payroll');
        Route::get('/ledger', [AccountantLedgerController::class, 'index'])
            ->middleware('permission:accountant.ledger.view')
            ->name('dash.accountant.ledger');
        Route::get('/reports', [AccountantReportController::class, 'index'])
            ->middleware('permission:accountant.reports.view')
            ->name('dash.accountant.reports');
        Route::get('/reports/export', [AccountantReportController::class, 'export'])
            ->middleware('permission:accountant.reports.view')
            ->name('dash.accountant.reports.export');
        Route::get('/audit', [AuditLogController::class, 'index'])
            ->middleware('permission:accountant.audit.view')
            ->name('dash.accountant.audit');
    });

    Route::prefix('dashboard/rider')->middleware('role:rider')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Dashboard'))->name('dash.rider');

        Route::get('/deliveries', fn () => Inertia::render('RiderPage/MyDeliveries'))
            ->middleware('permission:rider.deliveries.view')
            ->name('dash.rider.deliveries');
        Route::get('/history', fn () => Inertia::render('RiderPage/History'))
            ->middleware('permission:rider.history.view')
            ->name('dash.rider.history');
        Route::get('/audit', [AuditLogController::class, 'index'])
            ->middleware('permission:rider.audit.view')
            ->name('dash.rider.audit');
    });

    Route::prefix('dashboard/inventory')->middleware('role:inventory_manager|admin')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Dashboard'))->name('dash.inventory');

        // Stock Management
        Route::get('/counts', [StockController::class, 'stockCount'])
            ->middleware('permission:inventory.stock.view')
            ->name('dash.inventory.counts');
        Route::post('/counts/{inventoryBalance}/submit', [StockController::class, 'submitCount'])
            ->middleware('permission:inventory.stock.adjust')
            ->name('dash.inventory.counts.submit');
        Route::post('/counts/{stockCount}/review', [StockController::class, 'reviewCount'])
            ->middleware('permission:inventory.stock.view')
            ->name('dash.inventory.counts.review');
        Route::get('/low-stock', [StockController::class, 'lowStock'])
            ->middleware('permission:inventory.stock.low_stock')
            ->name('dash.inventory.lowstock');

        // Purchase Requests (backend = RestockRequest)
        Route::get('/purchases', [RestockRequestController::class, 'index'])
            ->middleware('permission:inventory.purchases.view')
            ->name('dash.inventory.purchases');
        Route::post('/purchase-requests', [RestockRequestController::class, 'store'])
            ->middleware('permission:inventory.purchases.create')
            ->name('dash.inventory.purchase-requests.store');


        Route::get('/purchases', [PurchaseController::class, 'index'])
        ->middleware('permission:inventory.purchases.view')
        ->name('dash.inventory.purchases');
        Route::post('/purchases', [PurchaseController::class, 'store'])
            ->middleware('permission:inventory.purchases.create')
            ->name('dash.inventory.purchases.store');
        Route::get('/purchases/{purchase}/edit', [PurchaseController::class, 'edit'])
            ->middleware('permission:inventory.purchases.update')
            ->name('dash.inventory.purchases.edit');
        Route::put('/purchases/{purchase}', [PurchaseController::class, 'update'])
            ->middleware('permission:inventory.purchases.update')
            ->name('dash.inventory.purchases.update');
        Route::post('/purchases/{purchase}/approve', [PurchaseController::class, 'approve'])
            ->middleware('permission:inventory.purchases.approve')
            ->name('dash.inventory.purchases.approve');
        Route::post('/purchases/{purchase}/reject', [PurchaseController::class, 'reject'])
            ->middleware('permission:inventory.purchases.approve')
            ->name('dash.inventory.purchases.reject');
        Route::post('/purchases/{purchase}/mark-delivered', [PurchaseController::class, 'markDelivered'])
            ->middleware('permission:inventory.purchases.mark_delivered')
            ->name('dash.inventory.purchases.mark-delivered');
        Route::post('/purchases/{purchase}/confirm', [PurchaseController::class, 'confirm'])
            ->middleware('permission:inventory.purchases.confirm')
            ->name('dash.inventory.purchases.confirm');
        Route::post('/purchases/{purchase}/discrepancy', [PurchaseController::class, 'discrepancy'])
            ->middleware('permission:inventory.purchases.confirm')
            ->name('dash.inventory.purchases.discrepancy');

        

        // Other Inventory Pages
        Route::get('/movements', [StockController::class, 'movements'])
            ->middleware('permission:inventory.movements.view')
            ->name('dash.inventory.movements');
        Route::get('/suppliers', [SupplierController::class, 'index'])
            ->middleware('permission:inventory.suppliers.view')
            ->name('dash.inventory.suppliers');
        Route::get('/audit', [AuditLogController::class, 'index'])
            ->middleware('permission:inventory.audit.view')
            ->name('dash.inventory.audit');

    });

});
