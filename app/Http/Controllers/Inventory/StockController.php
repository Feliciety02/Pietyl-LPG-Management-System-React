<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\InventoryBalance;
use App\Models\Supplier;
use App\Models\ProductVariant;
use Inertia\Inertia;

class StockController extends Controller
{
    /**
     * Display stock counts page
     */
    public function index(Request $request)
    {
        $per = (int) $request->get('per', 10);
        if ($per <= 0) $per = 10;

        $q = trim((string) $request->get('q', ''));

        $paginator = InventoryBalance::query()
            ->with(['productVariant.product', 'location'])
            ->when($q !== '', function ($query) use ($q) {
                $query->whereHas('productVariant.product', function ($qq) use ($q) {
                    $qq->where('name', 'like', "%{$q}%");
                })->orWhereHas('productVariant', function ($qq) use ($q) {
                    $qq->where('barcode', 'like', "%{$q}%")
                       ->orWhere('variant_name', 'like', "%{$q}%");
                });
            })
            ->orderByDesc('updated_at')
            ->paginate($per)
            ->withQueryString();

        $rows = $paginator->getCollection()->map(function ($balance) {
            $onHand = (int) $balance->qty_filled + (int) $balance->qty_empty;
            $available = $onHand - (int) $balance->qty_reserved;

            return [
                'id' => $balance->id,
                'location_id' => $balance->location_id,
                'location_name' => $balance->location->name ?? null,
                'sku' => $balance->productVariant->barcode ?? null,
                'product_name' => $balance->productVariant->product->name ?? null,
                'variant' => $balance->productVariant->variant_name ?? null,
                'filled_qty' => (int) $balance->qty_filled,
                'empty_qty' => (int) $balance->qty_empty,
                'total_qty' => $onHand,
                'qty_reserved' => (int) $balance->qty_reserved,
                'qty_available' => $available,
                'reorder_level' => (int) $balance->reorder_level,
                'last_counted_at' => $balance->updated_at?->format('M d, Y h:i A') ?? null,
                'updated_by' => 'System',
            ];
        });

        $paginator->setCollection($rows);

        return Inertia::render('InventoryPage/StockCounts', [
            'stock_counts' => $paginator,
            'filters' => [
                'q' => $q,
                'per' => $per,
                'page' => (int) $request->get('page', 1),
            ],
        ]);
    }

    public function update(Request $request, InventoryBalance $inventoryBalance)
    {
        $validated = $request->validate([
            'filled_qty' => 'required|integer|min:0',
            'empty_qty' => 'required|integer|min:0',
            'reason' => 'required|string|max:500',
            'reorder_level' => 'nullable|integer|min:0',
        ]);

        $inventoryBalance->update([
            'qty_filled' => $validated['filled_qty'],
            'qty_empty' => $validated['empty_qty'],
            'reorder_level' => $validated['reorder_level'] ?? $inventoryBalance->reorder_level,
        ]);

        return back()->with('success', 'Stock adjusted successfully');
    }

    public function lowStock(Request $request)
    {
        $per = (int) $request->get('per', 10);
        if ($per <= 0) $per = 10;

        $q = trim((string) $request->get('q', ''));
        $risk = strtolower(trim((string) $request->get('risk', 'all')));

        $query = InventoryBalance::query()
            ->with([
                'productVariant.product',
                'productVariant.suppliers',
                'location'
            ])
            ->whereRaw('((qty_filled + qty_empty) - qty_reserved) <= reorder_level');

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->whereHas('productVariant.product', function ($q2) use ($q) {
                    $q2->where('name', 'like', "%{$q}%");
                })
                ->orWhereHas('productVariant', function ($q2) use ($q) {
                    $q2->where('barcode', 'like', "%{$q}%")
                       ->orWhere('variant_name', 'like', "%{$q}%");
                })
                ->orWhereHas('location', function ($q2) use ($q) {
                    $q2->where('name', 'like', "%{$q}%");
                });
            });
        }

        if ($risk === 'critical') {
            $query->whereRaw('((qty_filled + qty_empty) - qty_reserved) <= (reorder_level * 0.25)');
        }

        if ($risk === 'warning') {
            $query->whereRaw('((qty_filled + qty_empty) - qty_reserved) > (reorder_level * 0.25)');
        }

        $paginator = $query
            ->orderByDesc('updated_at')
            ->paginate($per)
            ->withQueryString();

        $rows = $paginator->getCollection()->map(function ($balance) {
            $onHand = (int) $balance->qty_filled + (int) $balance->qty_empty;
            $available = $onHand - (int) $balance->qty_reserved;
            $reorderLevel = (int) $balance->reorder_level;

            $riskLevel = ($reorderLevel > 0 && $available <= ($reorderLevel * 0.25))
                ? 'critical'
                : 'warning';

            $primarySupplier = $balance->productVariant
                ?->suppliers()
                ->wherePivot('is_primary', true)
                ->first();

            return [
                'id' => $balance->id,
                'location_name' => $balance->location->name ?? null,
                'sku' => $balance->productVariant->barcode ?? null,
                'name' => $balance->productVariant->product->name ?? null,
                'variant' => $balance->productVariant->variant_name ?? null,
                'supplier_name' => $primarySupplier?->name ?? '—',
                'current_qty' => $available,
                'reorder_level' => $reorderLevel,
                'est_days_left' => rand(1, 5),
                'risk_level' => $riskLevel,
                'last_movement_at' => $balance->updated_at?->format('M d, Y h:i A'),
                'purchase_request_id' => null,
                'purchase_request_status' => null,
                'requested_by_name' => null,
                'requested_at' => null,
            ];
        });

        $paginator->setCollection($rows);

        return Inertia::render('InventoryPage/LowStock', [
            'low_stock' => $paginator,
            'filters' => [
                'q' => $q,
                'risk' => $risk,
                'per' => $per,
                'page' => (int) $request->get('page', 1),
            ],
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name']),
        ]);
    }
}
