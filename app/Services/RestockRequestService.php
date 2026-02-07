<?php

namespace App\Services;

use App\Models\InventoryBalance;
use App\Models\ProductVariant;
use App\Models\RestockRequest;
use App\Models\RestockRequestItem;
use App\Models\StockMovement;
use App\Models\SupplierPayable;
use App\Repositories\RestockRequestRepository;
use App\Services\Accounting\LedgerService;
use Illuminate\Support\Facades\DB;

class RestockRequestService
{
    protected RestockRequestRepository $repo;
    protected LedgerService $ledgerService;

    protected array $statusOrder = [
        RestockRequest::STATUS_DRAFT,
        RestockRequest::STATUS_SUBMITTED,
        RestockRequest::STATUS_APPROVED,
        RestockRequest::STATUS_RECEIVING,
        RestockRequest::STATUS_RECEIVED,
        RestockRequest::STATUS_PAYABLE_OPEN,
        RestockRequest::STATUS_PAID,
        RestockRequest::STATUS_CLOSED,
        RestockRequest::STATUS_REJECTED,
    ];

    public function __construct(RestockRequestRepository $repo, LedgerService $ledgerService)
    {
        $this->repo = $repo;
        $this->ledgerService = $ledgerService;
    }

    public function getRequestsForPage(array $filters = []): array
    {
        $paginated = $this->repo->getPaginated($filters);

        return [
            'data' => collect($paginated->items())
                ->map(fn (RestockRequest $request) => $this->mapRequest($request))
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
            ],
        ];
    }

    public function getKPIs(): array
    {
        $counts = RestockRequest::select(DB::raw('status, COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();

        $summary = [];
        foreach ($this->statusOrder as $status) {
            $summary[$status] = (int) ($counts[$status] ?? 0);
        }

        return [
            'counts' => $summary,
            'total_approved_cost' => (float) RestockRequest::where('status', RestockRequest::STATUS_APPROVED)->sum('total_cost'),
            'total_received_cost' => (float) RestockRequest::where('status', RestockRequest::STATUS_RECEIVED)->sum('total_cost'),
        ];
    }

    public function getRequestForReceiving(int $id): ?RestockRequest
    {
        return $this->repo->findById($id);
    }

    public function createRequest(array $data): RestockRequest
    {
        return DB::transaction(function () use ($data) {
            $request = RestockRequest::create([
                'request_number' => RestockRequest::generateRequestNumber(),
                'location_id' => $data['location_id'],
                'requested_by_user_id' => $data['requested_by_user_id'],
                'submitted_by_user_id' => $data['submitted_by_user_id'] ?? $data['requested_by_user_id'],
                'priority' => $data['priority'] ?? 'normal',
                'needed_by_date' => $data['needed_by_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'submitted_at' => $data['submitted_at'] ?? now(),
                'status' => RestockRequest::STATUS_SUBMITTED,
            ]);

            if (!empty($data['items'])) {
            $variantIds = array_unique(array_filter(array_map(
                fn ($item) => $item['product_variant_id'] ?? null,
                $data['items']
            )));
            $variants = ProductVariant::with('product')
                ->whereIn('id', $variantIds)
                ->get()
                ->keyBy('id');

            foreach ($data['items'] as $item) {
                $requestedQty = $item['requested_qty'] ?? 0;
                $variant = $variants[$item['product_variant_id']] ?? null;
                $defaultCost = (float) ($variant?->product?->supplier_cost ?? 0);
                $request->items()->create([
                    'product_variant_id' => $item['product_variant_id'],
                    'current_qty' => $item['current_qty'] ?? 0,
                    'reorder_level' => $item['reorder_level'] ?? 0,
                    'requested_qty' => $requestedQty,
                    'approved_qty' => $requestedQty,
                    'received_qty' => 0,
                    'unit_cost' => $defaultCost,
                    'line_total' => round($defaultCost * $requestedQty, 2),
                    'supplier_id' => $item['supplier_id'] ?? null,
                ]);
            }
        }

            return $request;
        });
    }

    public function approveRequest(int $id, array $payload, int $approverId): ?RestockRequest
    {
        $request = $this->repo->findById($id);
        if (!$request || $request->status === RestockRequest::STATUS_REJECTED) {
            return null;
        }

        return DB::transaction(function () use ($request, $payload, $approverId) {
            $supplierId = $payload['supplier_id'] ?? null;
            $lines = $payload['lines'] ?? [];

            if (!$supplierId) {
                throw new \InvalidArgumentException('Supplier is required.');
            }

            $lineMap = $request->items->keyBy('id');
            $total = 0;

            foreach ($lines as $linePayload) {
                $itemId = $linePayload['line_id'] ?? null;
                $item = $lineMap[$itemId] ?? null;
                if (!$item) {
                    continue;
                }

                $unitCost = max(0, (float) ($linePayload['unit_cost'] ?? 0));
                $approvedQty = $linePayload['approved_qty'] ?? $item->requested_qty;
                $approvedQty = max(0, min((float) $approvedQty, (float) $item->requested_qty));
                $lineTotal = round($unitCost * $approvedQty, 2);

                $item->update([
                    'approved_qty' => $approvedQty,
                    'unit_cost' => $unitCost,
                    'line_total' => $lineTotal,
                ]);

                $total += $lineTotal;
            }

            $request->update([
                'supplier_id' => $supplierId,
                'supplier_invoice_ref' => $payload['invoice_ref'] ?? null,
                'supplier_invoice_date' => $payload['invoice_date'] ?? null,
                'approved_by_user_id' => $approverId,
                'approved_at' => now(),
                'status' => RestockRequest::STATUS_APPROVED,
                'subtotal_cost' => $total,
                'total_cost' => $total,
            ]);

            return $request->refresh();
        });
    }

    public function rejectRequest(int $id, int $userId, ?string $reason = null): bool
    {
        $request = $this->repo->findById($id);
        if (!$request || $request->isRejected()) {
            return false;
        }

        $request->update([
            'status' => RestockRequest::STATUS_REJECTED,
            'approved_by_user_id' => $userId,
            'rejection_reason' => $reason,
        ]);

        return true;
    }

    public function receiveRequest(int $id, array $payload, int $receiverId): ?RestockRequest
    {
        $request = $this->repo->findById($id);
        if (!$request || !in_array($request->status, [RestockRequest::STATUS_APPROVED, RestockRequest::STATUS_RECEIVING])) {
            return null;
        }

        $lines = $payload['lines'] ?? [];

        return DB::transaction(function () use ($request, $lines, $receiverId) {
            $lineMap = $request->items->keyBy('id');
            $totalIncrement = 0;

            foreach ($lines as $payloadLine) {
                $lineId = $payloadLine['line_id'] ?? null;
                $increment = max(0, (float) ($payloadLine['received_qty_increment'] ?? 0));
                $item = $lineMap[$lineId] ?? null;
                if (!$item || $increment <= 0) {
                    continue;
                }

                $available = max(0, (float) $item->approved_qty - (float) $item->received_qty);
                $actual = min($increment, $available);

                if ($actual <= 0) {
                    continue;
                }

                $item->increment('received_qty', $actual);
                $totalIncrement += $actual;

                $this->recordInventoryForLine($request->location_id, $item, $actual, $receiverId, $request);
            }

            if ($totalIncrement <= 0) {
                return $request->refresh();
            }

            if (!$request->receiving_started_at) {
                $request->receiving_started_at = now();
            }

            if ($request->isFullyReceived()) {
                $request->status = RestockRequest::STATUS_RECEIVED;
                $request->received_at = now();
                $request->received_by_user_id = $receiverId;
            } else {
                $request->status = RestockRequest::STATUS_RECEIVING;
            }

            $request->save();

            if ($request->isFullyReceived()) {
                $this->ensurePayableForRequest($request, $receiverId);
            }

            return $request->refresh();
        });
    }

    protected function recordInventoryForLine(int $locationId, RestockRequestItem $item, float $quantity, int $userId, RestockRequest $request): void
    {
        $balance = InventoryBalance::firstOrCreate(
            [
                'location_id' => $locationId,
                'product_variant_id' => $item->product_variant_id,
            ],
            [
                'qty_filled' => 0,
                'qty_empty' => 0,
                'qty_reserved' => 0,
                'reorder_level' => 0,
            ]
        );

        $balance->increment('qty_filled', (int) round($quantity));

        StockMovement::create([
            'location_id' => $locationId,
            'product_variant_id' => $item->product_variant_id,
            'movement_type' => StockMovement::TYPE_PURCHASE_IN,
            'qty' => $quantity,
            'reference_type' => RestockRequest::class,
            'reference_id' => $request->id,
            'performed_by_user_id' => $userId,
            'moved_at' => now(),
            'notes' => "Received additional stock for {$request->request_number}",
        ]);
    }

    public function ensurePayableForRequest(RestockRequest $request, int $userId): ?SupplierPayable
    {
        if ($request->supplier_payable_id || !$request->supplier_id || !$request->total_cost) {
            return $request->payable;
        }

        $entry = $this->ledgerService->postEntry([
            'reference_type' => RestockRequest::class,
            'reference_id' => $request->id,
            'created_by_user_id' => $userId,
            'memo' => "Inventory receipt {$request->request_number}",
            'lines' => [
                [
                    'account_code' => '1200',
                    'debit' => $request->total_cost,
                    'description' => 'Inventory received',
                ],
                [
                    'account_code' => '2100',
                    'credit' => $request->total_cost,
                    'description' => 'Accounts payable to supplier',
                ],
            ],
        ]);

        $payable = SupplierPayable::create([
            'supplier_id' => $request->supplier_id,
            'source_type' => RestockRequest::class,
            'source_id' => $request->id,
            'amount' => $request->total_cost,
            'status' => SupplierPayable::STATUS_UNPAID,
            'created_by_user_id' => $userId,
            'ledger_entry_id' => $entry->id,
        ]);

        $request->update([
            'supplier_payable_id' => $payable->id,
            'status' => RestockRequest::STATUS_PAYABLE_OPEN,
        ]);

        return $payable;
    }

    protected function mapRequest(RestockRequest $request): array
    {
        $expectedQty = (float) $request->items->sum(fn ($item) => (float) $item->approved_qty);
        $receivedQty = (float) $request->items->sum(fn ($item) => (float) $item->received_qty);
        $receivedCost = (float) $request->items->sum(fn ($item) => (float) $item->unit_cost * min((float) $item->received_qty, (float) $item->approved_qty));

        return [
            'id' => $request->id,
            'request_number' => $request->request_number,
            'location' => $request->location?->name ?? '—',
            'status' => $request->status,
            'priority' => $request->priority,
            'requested_by' => $request->requestedBy?->name,
            'submitted_by' => $request->submittedBy?->name,
            'supplier_name' => $request->supplier?->name,
            'supplier_invoice_ref' => $request->supplier_invoice_ref,
            'supplier_invoice_date' => optional($request->supplier_invoice_date)?->toDateString(),
            'subtotal_cost' => (float) $request->subtotal_cost,
            'total_cost' => (float) $request->total_cost,
            'received_cost' => round($receivedCost, 2),
            'expected_qty' => $expectedQty,
            'received_qty' => $receivedQty,
            'items_count' => $request->items->count(),
            'supplier_payable' => $request->payable?->only(['id', 'status', 'amount', 'paid_at']),
            'items' => $request->items->map(fn ($item) => [
                'id' => $item->id,
                'product_variant_id' => $item->product_variant_id,
                'product_name' => $item->productVariant?->product?->name ?? '—',
                'variant_name' => $item->productVariant?->variant_name,
                'requested_qty' => (float) $item->requested_qty,
                'approved_qty' => (float) $item->approved_qty,
                'received_qty' => (float) $item->received_qty,
                'unit_cost' => (float) $item->unit_cost ?: (float) ($item->productVariant?->product?->supplier_cost ?? 0),
                'line_total' => (float) $item->line_total ?: round(((float) $item->unit_cost ?: (float) ($item->productVariant?->product?->supplier_cost ?? 0)) * (float) $item->approved_qty, 2),
                'remaining_qty' => $item->remainingQty(),
            ])->values()->all(),
            'created_at' => $request->created_at?->toDateTimeString(),
            'approved_at' => optional($request->approved_at)?->toDateTimeString(),
            'received_at' => optional($request->received_at)?->toDateTimeString(),
        ];
    }

    public function formatRequest(RestockRequest $request): array
    {
        return $this->mapRequest($request);
    }
}
