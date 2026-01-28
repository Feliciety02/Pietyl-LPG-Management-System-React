<?php

namespace App\Http\Controllers\Inventory;

use App\Console\Commands\StockServices;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\InventoryBalanceService;
use App\Models\InventoryBalance;
use App\Models\StockMovement;
use Inertia\Inertia;

class StockController extends Controller
{
    
    public function stockCount(InventoryBalanceService $svc)
    {
        $data = $svc->MapDataForCountPage();

        return Inertia::render('InventoryPage/StockCounts', [
            'stock_counts' => [
                'data' => $data->items(),
                'meta' => [
                    'current_page' => $data->currentPage(),
                    'last_page' => $data->lastPage(),
                    'from' => $data->firstItem(),
                    'to' => $data->lastItem(),
                    'total' => $data->total(),
                ],
                'links' => $data->linkCollection(),
            ],
        ]);
    }

   
    public function update(Request $request, InventoryBalance $inventoryBalance, InventoryBalanceService $svc)
    {
        $svc->adjustStock($inventoryBalance, $request->validate([
            'filled_qty' => 'required|integer|min:0',
            'empty_qty' => 'required|integer|min:0',
            'reorder_level' => 'nullable|integer|min:0',
        ]));
        
   
        return back()->with('success', 'Stock adjusted successfully');
    }

    
    public function lowStock(InventoryBalanceService $svc)
    {
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
        ]);
    }


    public function movements(Request $request)
    {
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
                return [
                    'id' => $movement->id,
                    'product_name' => $movement->productVariant->product->name ?? 'Unknown',
                    'variant' => $movement->productVariant->variant_name ?? null,
                    'sku' => $movement->productVariant->product->sku ?? null,
                    'qty' => abs($movement->qty),
                    'direction' => $movement->qty > 0 ? 'in' : 'out',
                    'type' => $movement->movement_type,
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