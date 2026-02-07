<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Services\RestockRequestService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RestockRequestController extends Controller
{
    protected RestockRequestService $svc;

    public function __construct(RestockRequestService $svc)
    {
        $this->svc = $svc;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.view')) {
            abort(403);
        }

        $filters = $request->only(['q', 'status', 'priority', 'per', 'page']);
        $requests = $this->svc->getRequestsForPage($filters);

        return Inertia::render('InventoryPage/Purchases', [
            'purchase_requests' => $requests,
            'filters' => $filters,
        ]);
    }

    public function adminIndex(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.view')) {
            abort(403);
        }

        $filters = $request->only(['q', 'status', 'priority', 'per', 'page']);
        $requests = $this->svc->getRequestsForPage($filters);

        return Inertia::render('AdminPage/StockRequests', [
            'stock_requests' => $requests,
            'filters' => $filters,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.create')) {
            abort(403);
        }

        // Transform the modal data to match the service's expected structure
        $data = [
            'requested_by_user_id' => auth()->id(),
            'location_id' => $request->input('location_id'),
            'priority' => 'normal',
            'needed_by_date' => null,
            'notes' => $request->input('note'),
            'items' => [
                [
                    'product_variant_id' => $request->input('product_variant_id'),
                    'requested_qty' => $request->input('qty'),
                    'current_qty' => $request->input('current_qty', 0),
                    'reorder_level' => $request->input('reorder_level', 0),
                    'supplier_id' => $request->input('supplier_id'),
                ]
            ]
        ];

        DB::transaction(function () use ($data, $request) {
            $restockRequest = $this->svc->createRequest($data);

            $productVariantId = $request->input('product_variant_id');
            $supplierId = $request->input('supplier_id');
            $qty = $request->input('qty');

            $variant = \App\Models\ProductVariant::find($productVariantId);
            $supplier = \App\Models\Supplier::find($supplierId);

            if ($variant && $supplier) {
                // Generate purchase number
                $lastPurchase = \App\Models\Purchase::orderBy('id', 'desc')->lockForUpdate()->first();
                if ($lastPurchase && preg_match('/P-(\d+)/', $lastPurchase->purchase_number, $matches)) {
                    $nextNumber = (int)$matches[1] + 1;
                } else {
                    $nextNumber = 1;
                }
                $purchaseNumber = 'P-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

                // Get unit cost from supplier pivot
                $supplierProduct = DB::table('supplier_products')
                    ->where('supplier_id', $supplierId)
                    ->where('product_variant_id', $productVariantId)
                    ->first();

                $unitCost = (float) ($supplierProduct->supplier_cost ?? 0);
                $lineTotal = $qty * $unitCost;

                // Create purchase
                $purchase = \App\Models\Purchase::create([
                    'purchase_number' => $purchaseNumber,
                    'supplier_id' => $supplierId,
                    'created_by_user_id' => auth()->id(),
                    'status' => 'pending',
                    'subtotal' => $lineTotal,
                    'grand_total' => $lineTotal,
                    'notes' => $request->input('note') ?? "Auto-created from restock request",
                    'ordered_at' => now(),
                ]);

                // Create purchase item
                $purchase->items()->create([
                    'product_variant_id' => $productVariantId,
                    'qty' => $qty,
                    'received_qty' => 0,
                    'unit_cost' => $unitCost,
                    'line_total' => $lineTotal,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Purchase request and purchase order created successfully');
    }

    public function approve(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.update')) {
            abort(403);
        }

        $success = $this->svc->approveRequest($id, auth()->id());

        if (!$success) {
            return redirect()->back()->with('error', 'Unable to approve request');
        }

        return redirect()->back()->with('success', 'Request approved successfully');
    }

    public function reject(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.update')) {
            abort(403);
        }

        $success = $this->svc->rejectRequest($id, auth()->id(), $request->input('reason'));

        if (!$success) {
            return redirect()->back()->with('error', 'Unable to reject request');
        }

        return redirect()->back()->with('success', 'Request rejected');
    }
}
