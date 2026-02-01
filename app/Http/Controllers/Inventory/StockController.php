<?php

namespace App\Http\Controllers\Inventory;

use App\Console\Commands\StockServices;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\InventoryBalanceService;
use App\Models\InventoryBalance;
use App\Models\StockMovement;
use App\Models\StockCount;
use App\Models\ProductVariant;
use App\Models\Location;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StockController extends Controller
{
    
    public function stockCount(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.stock.view')) {
            abort(403);
        }

        $filters = $request->only(['q', 'status', 'per', 'page']);
        $perPage = $request->input('per', 10);
        $status = $request->input('status', 'all');
        $location = Location::first();
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

        $existingVariantIds = InventoryBalance::where('location_id', $location->id)
            ->pluck('product_variant_id')
            ->all();
        $missingVariants = ProductVariant::whereNotIn('id', $existingVariantIds)->get();
        foreach ($missingVariants as $variant) {
            InventoryBalance::create([
                'location_id' => $location->id,
                'product_variant_id' => $variant->id,
                'qty_filled' => 0,
                'qty_empty' => 0,
                'qty_reserved' => 0,
                'reorder_level' => 0,
            ]);
        }

        $query = InventoryBalance::with(['productVariant.product', 'location'])
            ->where('location_id', $location->id);

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->whereHas('productVariant.product', function ($p) use ($q) {
                    $p->where('name', 'like', "%{$q}%")
                      ->orWhere('sku', 'like', "%{$q}%");
                })->orWhereHas('productVariant', function ($p) use ($q) {
                    $p->where('variant_name', 'like', "%{$q}%");
                });
            });
        }

        $balances = $query->paginate($perPage);

        $latestCounts = StockCount::select('stock_counts.*')
            ->join(DB::raw('(SELECT inventory_balance_id, MAX(id) as max_id FROM stock_counts GROUP BY inventory_balance_id) as latest'), function ($join) {
                $join->on('latest.inventory_balance_id', '=', 'stock_counts.inventory_balance_id');
                $join->on('latest.max_id', '=', 'stock_counts.id');
            })
            ->get()
            ->keyBy('inventory_balance_id');

        $latestCountIds = $latestCounts->pluck('id')->filter()->values();
        $movementByCountId = collect();
        if ($latestCountIds->count() > 0) {
            $movementByCountId = StockMovement::where('reference_type', StockCount::class)
                ->whereIn('reference_id', $latestCountIds)
                ->orderByDesc('id')
                ->get()
                ->unique('reference_id')
                ->keyBy('reference_id');
        }

        $items = $balances->getCollection()->map(function ($balance) use ($latestCounts, $status, $movementByCountId) {
            $latest = $latestCounts->get($balance->id);
            $latestStatus = $latest?->status ?? null;
            if ($status !== 'all' && $latestStatus !== $status) {
                return null;
            }

            $systemFilled = (int) $balance->qty_filled;
            $systemEmpty = (int) $balance->qty_empty;
            $systemTotal = $systemFilled + $systemEmpty;

            $countedFilled = (int) ($latest?->counted_filled ?? 0);
            $countedEmpty = (int) ($latest?->counted_empty ?? 0);
            $countedTotal = $countedFilled + $countedEmpty;
            $varianceTotal = $countedTotal - $systemTotal;
            $submittedBy = $latest?->createdBy?->name;
            $submittedAt = $latest?->submitted_at?->format('M d, Y h:i A');

            if ($latestStatus === 'rejected' || !$latestStatus) {
                $countedFilled = 0;
                $countedEmpty = 0;
                $countedTotal = 0;
                $varianceTotal = 0;
                $submittedBy = null;
                $submittedAt = null;
            }

            $movement = $latest?->id ? $movementByCountId->get($latest->id) : null;

            return [
                'id' => $balance->id,
                'inventory_balance_id' => $balance->id,
                'product_variant_id' => $balance->product_variant_id,
                'location_name' => $balance->location?->name,
                'sku' => $balance->productVariant->product->sku ?? null,
                'product_name' => $balance->productVariant->product->name ?? null,
                'variant' => $balance->productVariant->variant_name ?? null,
                'filled_qty' => $systemFilled,
                'empty_qty' => $systemEmpty,
                'total_qty' => $systemTotal,
                'last_counted_at' => $latest?->submitted_at?->format('M d, Y h:i A') ?? $balance->updated_at?->format('M d, Y h:i A'),
                'updated_by' => $latest?->createdBy?->name ?? 'System',
                'latest_count_id' => $latest?->id,
                'latest_status' => $latestStatus,
                'submitted_by' => $submittedBy,
                'submitted_at' => $submittedAt,
                'reviewed_by' => $latest?->reviewedBy?->name,
                'reviewed_at' => $latest?->reviewed_at?->format('M d, Y h:i A'),
                'system_filled' => $systemFilled,
                'system_empty' => $systemEmpty,
                'system_qty' => $systemTotal,
                'counted_filled' => $countedFilled,
                'counted_empty' => $countedEmpty,
                'counted_qty' => $countedTotal,
                'variance_qty' => $varianceTotal,
                'latest_movement_id' => $movement?->id,
            ];
        })->filter()->values();

        return Inertia::render('InventoryPage/StockCounts', [
            'stock_counts' => [
                'data' => $items,
                'meta' => [
                    'current_page' => $balances->currentPage(),
                    'last_page' => $balances->lastPage(),
                    'from' => $balances->firstItem(),
                    'to' => $balances->lastItem(),
                    'total' => $balances->total(),
                ],
            ],
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

        $latest = StockCount::where('inventory_balance_id', $inventoryBalance->id)
            ->orderByDesc('id')
            ->first();

        if ($latest && $latest->status === 'submitted') {
            return back()->with('error', 'A count is already pending review for this item.');
        }

        $systemFilled = (int) $inventoryBalance->qty_filled;
        $systemEmpty = (int) $inventoryBalance->qty_empty;
        $countedFilled = (int) $validated['filled_qty'];
        $countedEmpty = (int) $validated['empty_qty'];

        StockCount::create([
            'inventory_balance_id' => $inventoryBalance->id,
            'product_variant_id' => $inventoryBalance->product_variant_id,
            'location_id' => $inventoryBalance->location_id,
            'system_filled' => $systemFilled,
            'system_empty' => $systemEmpty,
            'counted_filled' => $countedFilled,
            'counted_empty' => $countedEmpty,
            'variance_filled' => $countedFilled - $systemFilled,
            'variance_empty' => $countedEmpty - $systemEmpty,
            'status' => 'submitted',
            'note' => $validated['reason'],
            'created_by_user_id' => $user->id,
            'submitted_at' => now(),
        ]);

        return back()->with('success', 'Stock count submitted for review.');
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

        if ($stockCount->status !== 'submitted') {
            return back()->with('error', 'This count is already reviewed.');
        }

        $approved = $validated['action'] === 'approve';
        $movementId = null;

        DB::transaction(function () use ($approved, $validated, $user, $stockCount, &$movementId) {
            if ($approved) {
                $stockCount->update([
                    'status' => 'approved',
                    'reviewed_by_user_id' => $user->id,
                    'reviewed_at' => now(),
                    'review_note' => $validated['note'] ?? null,
                ]);
            } else {
                $stockCount->update([
                    'status' => 'rejected',
                    'reviewed_by_user_id' => $user->id,
                    'reviewed_at' => now(),
                    'review_note' => $validated['note'] ?? null,
                    'counted_filled' => 0,
                    'counted_empty' => 0,
                    'variance_filled' => 0,
                    'variance_empty' => 0,
                    'submitted_at' => null,
                ]);
            }

            if (!$approved) {
                return;
            }

            $balance = InventoryBalance::find($stockCount->inventory_balance_id);
            if (!$balance) {
                return;
            }

            $beforeTotal = (int) $balance->qty_filled + (int) $balance->qty_empty;
            $afterTotal = (int) $stockCount->counted_filled + (int) $stockCount->counted_empty;
            $delta = $afterTotal - $beforeTotal;

            $balance->qty_filled = $stockCount->counted_filled;
            $balance->qty_empty = $stockCount->counted_empty;
            $balance->save();

            $movement = StockMovement::create([
                'location_id' => $balance->location_id,
                'product_variant_id' => $balance->product_variant_id,
                'movement_type' => StockMovement::TYPE_ADJUSTMENT,
                'qty' => $delta,
                'reference_type' => StockCount::class,
                'reference_id' => $stockCount->id,
                'performed_by_user_id' => $user->id,
                'moved_at' => Carbon::now(),
                'notes' => 'Stock count adjustment',
            ]);

            $movementId = $movement->id;
        });

        if ($approved && $movementId) {
            return redirect("/dashboard/inventory/audit?entity_type=StockMovement&q={$movementId}")
                ->with('success', 'Stock count approved.');
        }

        return back()->with('success', $approved ? 'Stock count approved.' : 'Stock count rejected.');
    }

    
    public function lowStock(Request $request, InventoryBalanceService $svc)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.stock.low_stock')) {
            abort(403);
        }

        $data = $svc->getLowStock();

        return Inertia::render('InventoryPage/LowStock', [
            'low_stock' => [
                'data' => $data['low_stock'],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'from' => 1,
                    'to' => count($data['low_stock']),
                    'total' => count($data['low_stock']),
                ],
            ],
            'product_hash' => $data['product_hash'],
            'suppliers' => $data['suppliers'],
            'suppliersByProduct' => $data['suppliersByProduct'] ?? [],
            'products' => $data['products'] ?? [],
        ]);
    }


    public function movements(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.movements.view')) {
            abort(403);
        }

        $query = StockMovement::with([
            'productVariant.product',
            'performedBy',
            'location'
        ]);

        // Search filter
        if ($request->filled('q')) {
            $search = $request->q;
            $query->where(function($q) use ($search) {
                $q->whereHas('productVariant.product', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
                });
            });
        }

        // Type filter
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('movement_type', $request->type);
        }

        // Direction filter
        if ($request->filled('direction')) {
            if ($request->direction === 'in') {
                $query->where('qty', '>', 0);
            } elseif ($request->direction === 'out') {
                $query->where('qty', '<', 0);
            }
        }

        $movements = $query->orderBy('moved_at', 'desc')
            ->paginate($request->per ?? 10)
            ->through(function ($movement) {
                // Map movement_type to display type
                $type = match($movement->movement_type) {
                    'purchase_in' => 'purchase',
                    'sale_out' => 'sale',
                    'adjustment' => 'adjustment',
                    'damage' => 'damage',
                    'transfer_in' => 'transfer',
                    'transfer_out' => 'transfer',
                    default => $movement->movement_type,
                };

                return [
                    'id' => $movement->id,
                    'product_name' => $movement->productVariant->product->name ?? 'Unknown',
                    'variant' => $movement->productVariant->variant_name ?? null,
                    'sku' => $movement->productVariant->product->sku ?? null,
                    'qty' => abs($movement->qty),
                    'direction' => $movement->qty > 0 ? 'in' : 'out',
                    'type' => $type,
                    'movement_type' => $movement->movement_type, // Original type
                    'actor_name' => $movement->performedBy->name ?? 'System',
                    'occurred_at' => $movement->moved_at->format('M d, Y h:i A'),
                    'reference_type' => $movement->reference_type,
                    'reference_id' => $movement->reference_id,
                    'notes' => $movement->notes,
                ];
            });

        return Inertia::render('InventoryPage/Movements', [
            'movements' => [
                'data' => $movements->items(),
                'meta' => [
                    'current_page' => $movements->currentPage(),
                    'last_page' => $movements->lastPage(),
                    'from' => $movements->firstItem(),
                    'to' => $movements->lastItem(),
                    'total' => $movements->total(),
                ],
            ],
            'filters' => $request->only(['q', 'type', 'direction', 'per']),
        ]);
    }
}
