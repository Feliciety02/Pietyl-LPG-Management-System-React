<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Sale;

uses(RefreshDatabase::class);

it('reprint endpoint creates receipt and increments printed_count', function () {
    $this->withoutMiddleware();

    // Create role
    $role = \Spatie\Permission\Models\Role::create(['name' => 'cashier', 'guard_name' => 'web']);

    $user = \App\Models\User::create([
        'name' => 'Test Cashier',
        'email' => 'test_cashier@example.com',
        'password' => bcrypt('secret'),
        'is_active' => true,
    ]);
    
    // Assign cashier role
    $user->assignRole('cashier');

    $sale = Sale::create([
        'sale_number' => 'TEST-001',
        'sale_type' => 'walkin',
        'cashier_user_id' => $user->id,
        'status' => 'paid',
        'sale_datetime' => now(),
        'subtotal' => 100.00,
        'discount_total' => 0.00,
        'tax_total' => 0.00,
        'grand_total' => 100.00,
        'vat_treatment' => 'exempt',
        'vat_rate' => 0.00,
        'vat_inclusive' => false,
        'vat_amount' => 0.00,
        'net_amount' => 100.00,
        'gross_amount' => 100.00,
        'vat_applied' => false,
    ]);

    expect($sale->receipt)->toBeNull();

    // Call reprint method directly
    $controller = new \App\Http\Controllers\Cashier\SaleController(
        app(\App\Services\SaleService::class),
        app(\App\Services\DailySummaryService::class)
    );
    
    $response = $controller->reprint($sale);
    $data = $response->getOriginalContent();

    expect($data['id'])->toBe($sale->id);
    expect($data['ref'])->not->toBeNull();
    expect($data['printed_count'])->toBe(1);
    
    // Verify receipt was created in DB
    $sale->load('receipt');
    expect($sale->receipt)->not->toBeNull();
    expect($sale->receipt->printed_count)->toBe(1);
});

it('print endpoint returns html view', function () {
    $this->withoutMiddleware();

    // Create role
    $role = \Spatie\Permission\Models\Role::create(['name' => 'cashier', 'guard_name' => 'web']);

    $user2 = \App\Models\User::create([
        'name' => 'Test Cashier 2',
        'email' => 'test_cashier2@example.com',
        'password' => bcrypt('secret'),
        'is_active' => true,
    ]);

    $sale = Sale::create([
        'sale_number' => 'TEST-002',
        'sale_type' => 'walkin',
        'cashier_user_id' => $user2->id,
        'status' => 'paid',
        'sale_datetime' => now(),
        'subtotal' => 50.00,
        'discount_total' => 0.00,
        'tax_total' => 0.00,
        'grand_total' => 50.00,
        'vat_treatment' => 'exempt',
        'vat_rate' => 0.00,
        'vat_inclusive' => false,
        'vat_amount' => 0.00,
        'net_amount' => 50.00,
        'gross_amount' => 50.00,
        'vat_applied' => false,
    ]);

    // Call printReceipt method directly
    $controller = new \App\Http\Controllers\Cashier\SaleController(
        app(\App\Services\SaleService::class),
        app(\App\Services\DailySummaryService::class)
    );
    
    $response = $controller->printReceipt($sale);
    
    // printReceipt returns a View, check that it's a view
    expect($response)->toBeInstanceOf(\Illuminate\View\View::class);
    expect($response->getName())->toBe('receipts.print');
});
