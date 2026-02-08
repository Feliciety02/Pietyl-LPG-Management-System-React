<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Location;
use App\Models\Product;
use App\Models\PurchaseReceipt;
use App\Models\PurchaseReceiptItem;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Supplier;
use App\Models\SupplierPurchaseCommitment;
use App\Services\Accounting\LedgerService;
use App\Services\InventoryBalanceService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PurchaseRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $this->authorize('viewAny', PurchaseRequest::class);

        $inventoryService = new InventoryBalanceService();
        $lowStock = $inventoryService->getLowStock([
            'per' => (int) ($request->input('per') ?? 10),
            'page' => (int) ($request->input('page') ?? 1),
            'q' => (string) ($request->input('q') ?? ''),
            'scope' => (string) ($request->input('scope') ?? 'low'),
        ]);

        $myRequests = PurchaseRequest::with(['items.product', 'supplier', 'commitment'])
            ->where('requested_by_user_id', $user->id)
            ->orderByDesc('requested_at')
            ->get()
            ->map(function (PurchaseRequest $pr) {
                return [
                    'id' => $pr->id,
                    'pr_number' => $pr->pr_number,
                    'status' => $pr->status,
                    'reason' => $pr->reason,
                    'notes' => $pr->notes,
                    'requested_at' => $pr->requested_at?->toDateTimeString(),
                    'total_estimated_cost' => $pr->total_estimated_cost,
                    'supplier' => $pr->supplier?->only(['id', 'name']),
                    'commitment_status' => $pr->commitment?->status,
                    'items' => $pr->items->map(function (PurchaseRequestItem $item) {
                        return [
                            'id' => $item->id,
                            'product_id' => $item->product_id,
                            'product_name' => $item->product?->name,
                            'requested_qty' => $item->requested_qty,
                            'approved_qty' => $item->approved_qty,
                            'received_qty' => $item->received_qty,
                            'damaged_qty' => $item->damaged_qty,
                        ];
                    })->values(),
                ];
            });

        return Inertia::render('InventoryPage/PurchaseRequests', [
            'lowStock' => $lowStock,
            'myRequests' => $myRequests,
            'products' => Product::where('is_active', true)->get(['id', 'name', 'sku']),
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name']),
            'locations' => Location::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', PurchaseRequest::class);

        $validated = $request->validate([
            'reason' => 'required|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.requested_qty' => 'required|integer|min:1',
            'items.*.unit_cost_estimated' => 'nullable|numeric|min:0',
        ]);

        $user = $request->user();

        DB::transaction(function () use ($validated, $user) {
            $purchaseRequest = PurchaseRequest::create([
                'pr_number' => $this->generatePrNumber(),
                'requested_by_user_id' => $user->id,
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
                'requested_at' => now(),
            ]);

            $this->syncItems($purchaseRequest, $validated['items']);
            $purchaseRequest->update(['total_estimated_cost' => $this->calculateEstimated($purchaseRequest)]);
        });

        return redirect()->route('dash.inventory.purchase-requests')->with('success', 'Purchase request saved as draft.');
    }

    public function update(Request $request, PurchaseRequest $purchaseRequest)
    {
        $this->authorize('update', $purchaseRequest);

        $validated = $request->validate([
            'reason' => 'required|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.requested_qty' => 'required|integer|min:1',
            'items.*.unit_cost_estimated' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $purchaseRequest) {
            $purchaseRequest->update([
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $this->syncItems($purchaseRequest, $validated['items'], true);
            $purchaseRequest->update(['total_estimated_cost' => $this->calculateEstimated($purchaseRequest)]);
        });

        return back()->with('success', 'Purchase request updated.');
    }

    public function submit(Request $request, PurchaseRequest $purchaseRequest)
    {
        $this->authorize('submit', $purchaseRequest);

        if ($purchaseRequest->items()->count() === 0) {
            return back()->with('error', 'Add at least one item before submitting.');
        }

        $purchaseRequest->update([
            'status' => PurchaseRequest::STATUS_SUBMITTED,
            'requested_at' => $purchaseRequest->requested_at ?? now(),
        ]);

        return back()->with('success', 'Purchase request submitted for approval.');
    }

    public function receive(Request $request, PurchaseRequest $purchaseRequest)
    {
        $this->authorize('receive', $purchaseRequest);

        $validated = $request->validate([
            'location_id' => 'required|exists:locations,id',
            'received_at' => 'nullable|date',
            'delivery_receipt_no' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.purchase_request_item_id' => 'required|exists:purchase_request_items,id',
            'items.*.received_qty' => 'required|integer|min:0',
            'items.*.damaged_qty' => 'required|integer|min:0',
            'items.*.unit_cost_final' => 'nullable|numeric|min:0',
        ]);

        $user = $request->user();
        $ledgerService = new LedgerService();

        DB::transaction(function () use ($validated, $purchaseRequest, $user, $ledgerService) {
            $receipt = PurchaseReceipt::create([
                'purchase_request_id' => $purchaseRequest->id,
                'received_by_user_id' => $user->id,
                'received_at' => isset($validated['received_at']) ? Carbon::parse($validated['received_at']) : now(),
                'delivery_receipt_no' => $validated['delivery_receipt_no'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $goodCost = 0;
            $damageCost = 0;

            foreach ($validated['items'] as $itemPayload) {
                $item = PurchaseRequestItem::findOrFail($itemPayload['purchase_request_item_id']);

                if ($item->purchase_request_id !== $purchaseRequest->id) {
                    throw ValidationException::withMessages(['items' => 'Item does not belong to this purchase request.']);
                }

                $received = (int) $itemPayload['received_qty'];
                $damaged = (int) $itemPayload['damaged_qty'];
                $unitCostFinal = $itemPayload['unit_cost_final'] ?? $item->unit_cost_final ?? 0;

                if ($damaged > $received) {
                    throw ValidationException::withMessages(['items' => 'Damaged quantity cannot exceed received quantity.']);
                }

                if ($item->approved_qty !== null && ($item->received_qty + $received) > $item->approved_qty) {
                    throw ValidationException::withMessages(['items' => 'Received quantity cannot exceed the approved quantity.']);
                }

                PurchaseReceiptItem::create([
                    'purchase_receipt_id' => $receipt->id,
                    'purchase_request_item_id' => $item->id,
                    'received_qty' => $received,
                    'damaged_qty' => $damaged,
                ]);

                $item->increment('received_qty', $received);
                $item->increment('damaged_qty', $damaged);
                $item->forceFill(['unit_cost_final' => $unitCostFinal])->save();

                $goodQty = max(0, $received - $damaged);
                $goodCost += $goodQty * $unitCostFinal;
                $damageCost += $damaged * $unitCostFinal;

                InventoryMovement::create([
                    'source_type' => PurchaseReceipt::class,
                    'source_id' => $receipt->id,
                    'location_id' => $validated['location_id'],
                    'product_id' => $item->product_id,
                    'qty_in' => $goodQty,
                    'qty_out' => 0,
                    'remarks' => 'Stock-in from receipt ' . ($receipt->delivery_receipt_no ?? $receipt->id),
                    'created_by_user_id' => $user->id,
                ]);
            }

            $requestItems = $purchaseRequest->items()->get();
            $allReceived = $requestItems->every(function (PurchaseRequestItem $item) {
                $target = $item->approved_qty ?? $item->requested_qty;
                return $target <= 0 || ($item->received_qty >= $target);
            });

            $purchaseRequest->update([
                'status' => $allReceived ? PurchaseRequest::STATUS_FULLY_RECEIVED : PurchaseRequest::STATUS_PARTIALLY_RECEIVED,
            ]);

            $commitment = $purchaseRequest->commitment ?? SupplierPurchaseCommitment::create([
                'purchase_request_id' => $purchaseRequest->id,
                'expense_type' => 'supplier_purchase_commitment',
                'reference' => $purchaseRequest->pr_number,
                'amount_estimated' => $purchaseRequest->total_estimated_cost,
                'currency' => $purchaseRequest->currency,
                'status' => SupplierPurchaseCommitment::STATUS_PENDING,
                'created_by_user_id' => $user->id,
            ]);

            $finalAmount = round($goodCost + $damageCost, 2);

            if ($finalAmount > 0) {
                $commitment->markPosted($finalAmount, $user);

                $lines = [];

                if ($goodCost > 0) {
                    $lines[] = [
                        'account_code' => '1200',
                        'description' => 'Inventory increase for ' . $purchaseRequest->pr_number,
                        'debit' => round($goodCost, 2),
                    ];
                }

                if ($damageCost > 0) {
                    $lines[] = [
                        'account_code' => '5200',
                        'description' => 'Damaged goods for ' . $purchaseRequest->pr_number,
                        'debit' => round($damageCost, 2),
                    ];
                }

                $lines[] = [
                    'account_code' => '2100',
                    'description' => 'Accounts payable for ' . $purchaseRequest->pr_number,
                    'credit' => round($finalAmount, 2),
                ];

                $ledgerService->postEntry([
                    'entry_date' => now()->toDateString(),
                    'reference_type' => SupplierPurchaseCommitment::class,
                    'reference_id' => $commitment->id,
                    'created_by_user_id' => $user->id,
                    'memo' => 'Inventory receipt for ' . $purchaseRequest->pr_number,
                    'lines' => $lines,
                ]);
            }
        });

        return back()->with('success', 'Receipt recorded and stock updated.');
    }

    private function syncItems(PurchaseRequest $purchaseRequest, array $items, bool $removeMissing = false): void
    {
        $productIds = collect($items)->pluck('product_id')->filter()->unique()->values();

        if ($removeMissing) {
            PurchaseRequestItem::where('purchase_request_id', $purchaseRequest->id)
                ->whereNotIn('product_id', $productIds)
                ->delete();
        }

        foreach ($items as $payload) {
            $quantity = max(0, (int) ($payload['requested_qty'] ?? 0));
            if ($quantity === 0) {
                continue;
            }

            PurchaseRequestItem::updateOrCreate(
                [
                    'purchase_request_id' => $purchaseRequest->id,
                    'product_id' => $payload['product_id'],
                ],
                [
                    'requested_qty' => $quantity,
                    'unit_cost_estimated' => $payload['unit_cost_estimated'] ?? null,
                ]
            );
        }
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

    private function generatePrNumber(): string
    {
        $date = now()->format('Ymd');
        $count = PurchaseRequest::whereDate('created_at', now()->toDateString())->count() + 1;

        return sprintf('PR-%s-%04d', $date, $count);
    }
}
