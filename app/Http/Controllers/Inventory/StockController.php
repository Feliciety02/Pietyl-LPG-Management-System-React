<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\InventoryBalanceService;
use App\Services\Inventory\StockService;
use App\Models\InventoryBalance;
use App\Models\ProductVariant;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Models\StockCount;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    public function __construct(
        private StockService $stockService
    ) {}

    public function stockCount(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.stock.view')) {
            abort(403);
        }

        $filters = $request->only(['q', 'status', 'per', 'page']);
        $perPage = $request->input('per', 10);
        $status = $request->input('status', 'all');
        
        $location = $this->stockService->getFirstLocation();
        
        if (!$location) {
            return Inertia::render('InventoryPage/StockCounts', [
                'stock_counts' => [
                    'data' => [],
                    'meta' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'from' => 0,
                        'to' => 0,
                        'total' => 0,
                    ],
                ],
                'filters' => $filters,
            ]);
        }

        $stockCounts = $this->stockService->getStockCountsForIndex(
            locationId: $location->id,
            search: $request->input('q'),
            status: $status,
            perPage: $perPage
        );

        return Inertia::render('InventoryPage/StockCounts', [
            'stock_counts' => $stockCounts,
            'filters' => $filters,
        ]);
    }

    public function submitCount(Request $request, InventoryBalance $inventoryBalance)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.stock.adjust')) {
            abort(403);
        }

        if ($user->hasRole('admin')) {
            return back()->with('error', 'Admin cannot submit stock counts.');
        }

        $validated = $request->validate([
            'filled_qty' => 'required|integer|min:0',
            'empty_qty' => 'required|integer|min:0',
            'reason' => 'required|string|min:3',
        ]);

        try {
            $this->stockService->submitStockCount($inventoryBalance, $validated, $user);
            return back()->with('success', 'Stock count submitted for review.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function reviewCount(Request $request, StockCount $stockCount)
    {
        $user = $request->user();
        if (!$user || !$user->hasRole('admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'note' => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($stockCount, $validated, $user, &$movementId) {
                $movementId = $this->stockService->reviewStockCount($stockCount, $validated, $user);
            });

            $approved = $validated['action'] === 'approve';
            
            if ($approved && $movementId) {
                return redirect("/dashboard/inventory/audit?entity_type=StockMovement&q={$movementId}")
                    ->with('success', 'Stock count approved.');
            }

            return back()->with('success', $approved ? 'Stock count approved.' : 'Stock count rejected.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function lowStock(Request $request, InventoryBalanceService $inventoryBalanceService)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.stock.low_stock')) {
            abort(403);
        }

        $filters = $request->only(['q', 'risk', 'req', 'scope', 'per', 'page']);
        $data = $inventoryBalanceService->getLowStock($filters);

        return Inertia::render('InventoryPage/Lowstock', [
            'low_stock' => $data['low_stock'],
            'product_hash' => $data['product_hash'],
            'suppliersByProduct' => $data['suppliersByProduct'],
            'suppliers' => $data['suppliers'],
            'products' => $data['products'],
            'scope' => $data['scope'],
            'filters' => $filters,
        ]);
    }

    public function thresholds(Request $request, InventoryBalanceService $svc)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.stock.low_stock')) {
            abort(403);
        }

        $filters = $request->only(['q', 'risk', 'req', 'per', 'page']);
        $filters['scope'] = 'all';

        $location = $this->stockService->getFirstLocation();
        if (!$location) {
            return Inertia::render('InventoryPage/Thresholds', [
                'thresholds' => [
                    'data' => [],
                    'meta' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'from' => 0,
                        'to' => 0,
                        'total' => 0,
                        'per_page' => (int) ($filters['per'] ?? 10),
                    ],
                ],
                'filters' => $filters,
            ]);
        }

        $this->ensureBalancesForLocation($location->id);

        $perPage = (int) ($filters['per'] ?? 10);
        $page = (int) ($filters['page'] ?? 1);
        $q = trim((string) ($filters['q'] ?? ''));
        $riskFilter = (string) ($filters['risk'] ?? 'all');

        $balances = InventoryBalance::with(['productVariant.product'])
            ->where('location_id', $location->id)
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->whereHas('productVariant.product', function ($prod) use ($q) {
                        $prod->where('name', 'like', "%{$q}%")
                            ->orWhere('sku', 'like', "%{$q}%");
                    })->orWhereHas('productVariant', function ($variant) use ($q) {
                        $variant->where('variant_name', 'like', "%{$q}%");
                    });
                });
            })
            ->get();

        $mapped = $balances->map(function (InventoryBalance $balance) {
            $available = ($balance->qty_filled + $balance->qty_empty) - $balance->qty_reserved;
            $reorderLevel = (int) ($balance->reorder_level ?? 0);

            if ($reorderLevel <= 0) {
                $riskLevel = 'ok';
            } else {
                $ratio = $available / $reorderLevel;
                if ($ratio <= 0.5) {
                    $riskLevel = 'critical';
                } elseif ($ratio < 1) {
                    $riskLevel = 'warning';
                } else {
                    $riskLevel = 'ok';
                }
            }

            return [
                'id' => $balance->id,
                'sku' => $balance->productVariant?->product?->sku,
                'name' => $balance->productVariant?->product?->name ?? '—',
                'variant' => $balance->productVariant?->variant_name ?? '',
                'current_qty' => $available,
                'reorder_level' => $reorderLevel,
                'risk_level' => $riskLevel,
                'last_movement_at' => $balance->updated_at?->format('M d, Y h:i A'),
            ];
        });

        $filtered = $mapped->filter(function ($row) use ($riskFilter) {
            if ($riskFilter !== 'all' && ($row['risk_level'] ?? '') !== $riskFilter) {
                return false;
            }
            return true;
        })->values();

        $total = $filtered->count();
        $page = max(1, $page);
        $perPage = max(1, $perPage);
        $slice = $filtered->slice(($page - 1) * $perPage, $perPage)->values();

        $paginator = new LengthAwarePaginator(
            $slice,
            $total,
            $perPage,
            $page
        );

        return Inertia::render('InventoryPage/Thresholds', [
            'thresholds' => [
                'data' => $paginator->items(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'from' => $paginator->firstItem(),
                    'to' => $paginator->lastItem(),
                    'total' => $paginator->total(),
                    'per_page' => $paginator->perPage(),
                ],
            ],
            'filters' => $filters,
        ]);
    }

    private function ensureBalancesForLocation(int $locationId): void
    {
        $existing = InventoryBalance::where('location_id', $locationId)
            ->pluck('product_variant_id');

        $missing = $existing->isEmpty()
            ? ProductVariant::query()->pluck('id')
            : ProductVariant::query()->whereNotIn('id', $existing)->pluck('id');

        if ($missing->isEmpty()) {
            return;
        }

        $now = now();
        $rows = $missing->map(function ($variantId) use ($locationId, $now) {
            return [
                'location_id' => $locationId,
                'product_variant_id' => $variantId,
                'qty_filled' => 0,
                'qty_empty' => 0,
                'qty_reserved' => 0,
                'reorder_level' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        })->all();

        InventoryBalance::insert($rows);
    }

    public function updateThresholds(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.stock.low_stock')) {
            abort(403);
        }

        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|integer|exists:inventory_balances,id',
            'updates.*.reorder_level' => 'required|numeric|min:0',
        ]);

        $updates = collect($validated['updates']);
        $balances = InventoryBalance::whereIn('id', $updates->pluck('id')->unique())->get()->keyBy('id');

        foreach ($updates as $entry) {
            $balance = $balances->get($entry['id']);
            if (!$balance) {
                continue;
            }
            $balance->reorder_level = $entry['reorder_level'];
            $balance->save();
        }

        return back()->with('success', 'Thresholds updated.');
    }


    public function movements(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.movements.view')) {
            abort(403);
        }

        $movements = $this->stockService->getStockMovementsForIndex(
            search: $request->input('q'),
            type: $request->input('type'),
            direction: $request->input('direction'),
            perPage: $request->input('per', 10)
        );

        return Inertia::render('InventoryPage/Movements', [
            'movements' => $movements,
            'filters' => $request->only(['q', 'type', 'direction', 'per']),
        ]);
    }
}
