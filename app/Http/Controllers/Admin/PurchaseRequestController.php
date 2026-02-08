<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Supplier;
use App\Models\SupplierPurchaseCommitment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseRequestController extends Controller
{
    public function queue(Request $request)
    {
        $this->authorize('viewAny', PurchaseRequest::class);

        $requests = PurchaseRequest::with(['requestedBy', 'supplier', 'items.product', 'commitment'])
            ->whereIn('status', [
                PurchaseRequest::STATUS_SUBMITTED,
                PurchaseRequest::STATUS_APPROVED_PENDING_SUPPLIER,
                PurchaseRequest::STATUS_SUPPLIER_CONTACTED_WAITING_DELIVERY,
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (PurchaseRequest $request) {
                return [
                    'id' => $request->id,
                    'pr_number' => $request->pr_number,
                    'status' => $request->status,
                    'requested_by' => $request->requestedBy?->only(['id', 'name']),
                    'supplier' => $request->supplier?->only(['id', 'name']),
                    'items' => $request->items->map(fn (PurchaseRequestItem $item) => [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product?->name,
                        'requested_qty' => $item->requested_qty,
                        'approved_qty' => $item->approved_qty,
                        'unit_cost_estimated' => $item->unit_cost_estimated,
                    ]),
                    'total_estimated_cost' => $request->total_estimated_cost,
                    'notes' => $request->notes,
                    'reason' => $request->reason,
                    'expected_delivery_date' => $request->expected_delivery_date?->toDateString(),
                    'commitment_status' => $request->commitment?->status,
                ];
            });

        return Inertia::render('AdminPage/PurchaseRequestQueue', [
            'requests' => $requests,
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function approve(Request $request, PurchaseRequest $purchaseRequest)
    {
        $this->authorize('approve', $purchaseRequest);

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.purchase_request_item_id' => 'required|exists:purchase_request_items,id',
            'items.*.approved_qty' => 'required|integer|min:0',
            'items.*.unit_cost_estimated' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $purchaseRequest, $request) {
            foreach ($validated['items'] as $itemPayload) {
                $item = PurchaseRequestItem::findOrFail($itemPayload['purchase_request_item_id']);
                if ($item->purchase_request_id !== $purchaseRequest->id) {
                    continue;
                }

                $item->update([
                    'approved_qty' => $itemPayload['approved_qty'],
                    'unit_cost_estimated' => $itemPayload['unit_cost_estimated'],
                ]);
            }

            $purchaseRequest->update([
                'status' => PurchaseRequest::STATUS_APPROVED_PENDING_SUPPLIER,
                'admin_user_id' => $request->user()->id,
                'admin_action_at' => now(),
                'supplier_id' => $validated['supplier_id'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ? Carbon::parse($validated['expected_delivery_date'])->toDateString() : null,
                'notes' => $validated['notes'] ?? $purchaseRequest->notes,
                'total_estimated_cost' => $this->calculateEstimated($purchaseRequest),
            ]);
        });

        return back()->with('success', 'Purchase request approved.');
    }

    public function reject(Request $request, PurchaseRequest $purchaseRequest)
    {
        $this->authorize('reject', $purchaseRequest);

        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $purchaseRequest->update([
            'status' => PurchaseRequest::STATUS_REJECTED,
            'rejection_reason' => $validated['rejection_reason'],
            'admin_user_id' => $request->user()->id,
            'admin_action_at' => now(),
        ]);

        return back()->with('success', 'Purchase request rejected.');
    }

    public function supplierContacted(Request $request, PurchaseRequest $purchaseRequest)
    {
        $this->authorize('markSupplierContacted', $purchaseRequest);

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'supplier_reference' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $purchaseRequest, $request) {
            $purchaseRequest->update([
                'status' => PurchaseRequest::STATUS_SUPPLIER_CONTACTED_WAITING_DELIVERY,
                'supplier_id' => $validated['supplier_id'],
                'supplier_contacted_at' => now(),
                'expected_delivery_date' => $validated['expected_delivery_date'] ? Carbon::parse($validated['expected_delivery_date'])->toDateString() : null,
                'notes' => $validated['notes'] ?? $purchaseRequest->notes,
                'admin_user_id' => $request->user()->id,
                'admin_action_at' => now(),
                'total_estimated_cost' => $this->calculateEstimated($purchaseRequest),
            ]);

            $commitment = SupplierPurchaseCommitment::firstOrNew([
                'purchase_request_id' => $purchaseRequest->id,
            ]);

            $commitment->expense_type = 'supplier_purchase_commitment';
            $commitment->reference = $purchaseRequest->pr_number;
            $commitment->amount_estimated = $purchaseRequest->total_estimated_cost;
            $commitment->currency = $purchaseRequest->currency;
            $commitment->status = SupplierPurchaseCommitment::STATUS_PENDING;
            $commitment->created_by_user_id = $commitment->created_by_user_id ?? $request->user()->id;
            $commitment->notes = $validated['supplier_reference'] ?? $commitment->notes;
            $commitment->save();
        });

        return back()->with('success', 'Supplier marked as contacted.');
    }

    public function cancel(Request $request, PurchaseRequest $purchaseRequest)
    {
        $this->authorize('cancel', $purchaseRequest);

        $purchaseRequest->update([
            'status' => PurchaseRequest::STATUS_CANCELLED,
            'admin_user_id' => $request->user()->id,
            'admin_action_at' => now(),
        ]);

        if ($commitment = $purchaseRequest->commitment) {
            $commitment->status = SupplierPurchaseCommitment::STATUS_CANCELLED;
            $commitment->save();
        }

        return back()->with('success', 'Purchase request cancelled.');
    }

    private function calculateEstimated(PurchaseRequest $purchaseRequest): float
    {
        $total = 0;
        foreach ($purchaseRequest->items as $item) {
            $qty = $item->approved_qty ?? $item->requested_qty;
            $cost = $item->unit_cost_estimated ?? 0;
            $total += ($qty) * $cost;
        }

        return round($total, 2);
    }
}
