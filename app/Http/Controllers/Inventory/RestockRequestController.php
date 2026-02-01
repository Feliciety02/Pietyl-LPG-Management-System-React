<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Services\RestockRequestService;
use Illuminate\Http\Request;
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
            'purchase_requests' => $requests,  // ← Frontend expects this name
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
            'notes' => $request->input('note'), // The note field from the modal
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
       
        $this->svc->createRequest($data);

        return redirect()->back()->with('success', 'Purchase request created successfully');
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
