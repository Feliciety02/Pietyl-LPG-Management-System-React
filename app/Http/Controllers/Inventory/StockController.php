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
    public function index()
    {
        $inventoryBalances = InventoryBalance::with(['productVariant.product', 'location'])
            ->get()
            ->map(function ($balance) {
                return [
                    'id' => $balance->id,
                    'location_id' => $balance->location_id,
                    'location_name' => $balance->location->name ?? null,
                    'sku' => $balance->productVariant->barcode ?? null,
                    'product_name' => $balance->productVariant->product->name ?? null,
                    'variant' => $balance->productVariant->variant_name ?? null,
                    'filled_qty' => (int)$balance->qty_filled,
                    'empty_qty' => (int)$balance->qty_empty,
                    'total_qty' => (int)$balance->qty_on_hand,
                    'qty_reserved' => (int)$balance->qty_reserved,
                    'qty_available' => $balance->qty_on_hand - $balance->qty_reserved,
                    'reorder_level' => (int)$balance->reorder_level,
                    'last_counted_at' => $balance->updated_at?->format('M d, Y h:i A') ?? null,
                    'updated_by' => 'System',
                ];
            });

        return Inertia::render('InventoryPage/StockCounts', [
            'stock_counts' => [
                'data' => $inventoryBalances,
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'from' => 1,
                    'to' => $inventoryBalances->count(),
                    'total' => $inventoryBalances->count(),
                ],
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

        $oldFilled = $inventoryBalance->qty_filled;
        $oldEmpty = $inventoryBalance->qty_empty;

        $inventoryBalance->update([
            'qty_filled' => $validated['filled_qty'],
            'qty_empty' => $validated['empty_qty'],
            'reorder_level' => $validated['reorder_level'] ?? $inventoryBalance->reorder_level,
        ]);

        // TODO: Create stock movement record for audit trail
        // StockMovement::create([
        //     'location_id' => $inventoryBalance->location_id,
        //     'product_variant_id' => $inventoryBalance->product_variant_id,
        //     'movement_type' => 'adjustment',
        //     'qty' => ($validated['filled_qty'] + $validated['empty_qty']) - ($oldFilled + $oldEmpty),
        //     'performed_by_user_id' => auth()->id(),
        //     'moved_at' => now(),
        //     'notes' => $validated['reason'],
        // ]);

        return back()->with('success', 'Stock adjusted successfully');
    }

    
    public function lowStock()
    {
        $lowStockItems = InventoryBalance::with([
            'productVariant.product',
            'productVariant.suppliers',
            'location'
        ])
        ->get()
        ->filter(function ($balance) {
            $available = $balance->qty_on_hand - $balance->qty_reserved;
            return $available <= $balance->reorder_level;
        })
        ->map(function ($balance) {
            $available = $balance->qty_on_hand - $balance->qty_reserved;
            $reorderLevel = $balance->reorder_level;
            
            if ($available <= $reorderLevel * 0.25) {
                $riskLevel = 'critical';
            } else {
                $riskLevel = 'warning';
            }

            $primarySupplier = $balance->productVariant->suppliers()
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

        $productHash = [];
        $allVariants = ProductVariant::with(['product', 'suppliers'])->get();
        
        foreach ($allVariants as $variant) {
            $key = $variant->product->name . '|' . $variant->variant_name;
            
            if (!isset($productHash[$key])) {
                $primarySupplier = $variant->suppliers()
                    ->wherePivot('is_primary', true)
                    ->first();
                
                $productHash[$key] = [
                    'id' => $variant->id,
                    'sku' => $variant->barcode,
                    'name' => $variant->product->name,
                    'variant' => $variant->variant_name,
                    'default_supplier_id' => $primarySupplier?->id,
                    'supplier_ids' => $variant->suppliers->pluck('id')->toArray(),
                ];
            } else {
                $existingSuppliers = $productHash[$key]['supplier_ids'];
                $newSuppliers = $variant->suppliers->pluck('id')->toArray();
                $productHash[$key]['supplier_ids'] = array_unique(array_merge($existingSuppliers, $newSuppliers));
            }
        }

        return Inertia::render('InventoryPage/LowStock', [
            'low_stock' => [
                'data' => $lowStockItems->values(),
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'from' => 1,
                    'to' => $lowStockItems->count(),
                    'total' => $lowStockItems->count(),
                ],
            ],
            'product_hash' => array_values($productHash),
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name']),
        ]);
    }
}