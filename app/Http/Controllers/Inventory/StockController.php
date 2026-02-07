<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\InventoryBalanceService;
use App\Services\Inventory\StockService;
use App\Models\InventoryBalance;
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

    public function lowStock(Request $request, InventoryBalanceService $svc)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.stock.low_stock')) {
            abort(403);
        }

        $filters = $request->only(['q', 'risk', 'req', 'per', 'page']);
        $data = $svc->getLowStock($filters);

        return Inertia::render('InventoryPage/OrderStocks', [
            'low_stock' => $data['low_stock'],
            'product_hash' => $data['product_hash'],
            'suppliers' => $data['suppliers'],
            'suppliersByProduct' => $data['suppliersByProduct'] ?? [],
            'products' => $data['products'] ?? [],
            'scope' => $data['scope'] ?? 'low',
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
        $data = $svc->getLowStock($filters);

        return Inertia::render('InventoryPage/Thresholds', [
            'thresholds' => $data['low_stock'],
            'suppliers' => $data['suppliers'],
            'suppliersByProduct' => $data['suppliersByProduct'] ?? [],
            'products' => $data['products'] ?? [],
            'scope' => $data['scope'] ?? 'all',
            'filters' => $filters,
        ]);
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