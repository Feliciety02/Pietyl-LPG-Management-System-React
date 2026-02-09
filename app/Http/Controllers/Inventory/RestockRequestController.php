<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Location;
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

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.create')) {
            abort(403);
        }

        $validated = $request->validate([
            'product_variant_id' => 'required|integer',
            'qty' => 'required|numeric|min:0.01',
            'current_qty' => 'nullable|numeric|min:0',
            'reorder_level' => 'nullable|numeric|min:0',
            'supplier_id' => 'nullable|integer',
            'location_id' => 'nullable|integer',
            'note' => 'nullable|string',
        ]);

        $locationId = $validated['location_id'] ?? Location::first()?->id;
        if (!$locationId) {
            return redirect()->back()->with('error', 'No location configured for requests.');
        }

        $payload = [
            'requested_by_user_id' => $user->id,
            'submitted_by_user_id' => $user->id,
            'location_id' => $locationId,
            'priority' => 'normal',
            'needed_by_date' => null,
            'notes' => $validated['note'] ?? null,
            'items' => [
                [
                    'product_variant_id' => $validated['product_variant_id'],
                    'requested_qty' => $validated['qty'],
                    'current_qty' => $validated['current_qty'] ?? 0,
                    'reorder_level' => $validated['reorder_level'] ?? 0,
                    'supplier_id' => $validated['supplier_id'] ?? null,
                ],
            ],
        ];

        $this->svc->createRequest($payload);

        return redirect()->back()->with('success', 'Purchase request created successfully.');
    }

    public function approve(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.update')) {
            abort(403);
        }

        $validated = $request->validate([
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'invoice_ref' => 'nullable|string|max:100',
            'invoice_date' => 'nullable|date',
            'lines' => 'required|array',
            'lines.*.line_id' => 'required|integer',
            'lines.*.unit_cost' => 'required|numeric|min:0',
            'lines.*.approved_qty' => 'nullable|numeric|min:0',
        ]);

        $this->svc->approveRequest($id, $validated, $user->id);

        return redirect()->back()->with('success', 'Request approved successfully.');
    }

    public function reject(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.update')) {
            abort(403);
        }

        $reason = $request->input('reason');
        $this->svc->rejectRequest($id, $user->id, $reason);

        return redirect()->back()->with('success', 'Request rejected.');
    }

    public function receivePage(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.view')) {
            abort(403);
        }

        $stockRequest = $this->svc->getRequestForReceiving($id);
        if (!$stockRequest) {
            abort(404);
        }

        return Inertia::render('InventoryPage/ReceiveStockRequest', [
            'stock_request' => $this->svc->formatRequest($stockRequest),
        ]);
    }

    public function receive(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.update')) {
            abort(403);
        }

        $validated = $request->validate([
            'lines' => 'required|array',
            'lines.*.line_id' => 'required|integer',
            'lines.*.received_qty_increment' => 'required|numeric|min:0',
        ]);

        $this->svc->receiveRequest($id, $validated, $user->id);

        return redirect()->back()->with('success', 'Receipt saved.');
    }
}
