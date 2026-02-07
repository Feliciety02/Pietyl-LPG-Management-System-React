<?php

use App\Models\LedgerEntry;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\RestockRequest;
use App\Models\RestockRequestItem;
use App\Models\Supplier;
use App\Models\SupplierPayable;
use App\Models\User;
use App\Repositories\RestockRequestRepository;
use App\Services\Accounting\LedgerService;
use App\Services\RestockRequestService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('restock payable ledger posting is idempotent', function () {
    $location = Location::create(['name' => 'Main Warehouse']);
    $user = User::create([
        'name' => 'Inventory User',
        'email' => 'inventory@test.local',
        'password' => bcrypt('secret123'),
    ]);
    $supplier = Supplier::create(['name' => 'Test Supplier', 'is_active' => true]);
    $product = Product::create([
        'sku' => 'LPG-001',
        'name' => 'LPG Cylinder',
        'category' => 'lpg',
        'is_active' => true,
        'created_by_user_id' => $user->id,
    ]);
    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'variant_name' => '11kg',
        'size_value' => 11,
        'size_unit' => 'kg',
        'container_type' => 'lpg',
        'barcode' => 'TEST-BRC-001',
        'is_active' => true,
    ]);

    $request = RestockRequest::create([
        'request_number' => 'RR-TEST-0001',
        'location_id' => $location->id,
        'requested_by_user_id' => $user->id,
        'submitted_by_user_id' => $user->id,
        'status' => RestockRequest::STATUS_RECEIVED,
        'priority' => 'normal',
        'supplier_id' => $supplier->id,
        'total_cost' => 200,
    ]);

    RestockRequestItem::create([
        'restock_request_id' => $request->id,
        'product_variant_id' => $variant->id,
        'current_qty' => 0,
        'reorder_level' => 0,
        'requested_qty' => 10,
        'approved_qty' => 10,
        'received_qty' => 10,
        'unit_cost' => 20,
        'line_total' => 200,
    ]);

    $service = new RestockRequestService(new RestockRequestRepository(), new LedgerService());

    $service->ensurePayableForRequest($request, $user->id);
    expect(SupplierPayable::count())->toBe(1);
    expect(LedgerEntry::count())->toBe(1);

    $service->ensurePayableForRequest($request, $user->id);
    expect(SupplierPayable::count())->toBe(1);
    expect(LedgerEntry::count())->toBe(1);
});
