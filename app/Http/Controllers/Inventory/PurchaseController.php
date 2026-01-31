<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Purchase;

class PurchaseController extends Controller
{
   
    public function index(Request $request)
    {
        $query = Purchase::with([
            'supplier',
            'items.productVariant.product'
        ]);

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('purchase_number', 'like', "%{$q}%")
                    ->orWhereHas('supplier', fn ($s) =>
                        $s->where('name', 'like', "%{$q}%")
                    )
                    ->orWhereHas('items.productVariant.product', fn ($p) =>
                        $p->where('name', 'like', "%{$q}%")
                    );
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $perPage = $request->per ?? 10;
        $purchases = $query->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        $data = $purchases->getCollection()->map(function ($purchase) {
            $item = $purchase->items->first();

            return [
                'id' => $purchase->id,
                'reference_no' => $purchase->purchase_number,
                'supplier_name' => $purchase->supplier->name ?? '—',

                'product_name' => $item?->productVariant?->product?->name ?? '—',
                'variant' => $item?->productVariant?->variant_name ?? '—',

                'qty' => (float) ($item->qty ?? 0),
                'received_qty' => (float) ($item->received_qty ?? 0),
                'unit_cost' => (float) ($item->unit_cost ?? 0),
                'total_cost' => (float) ($item->line_total ?? 0),

                'status' => $purchase->status,
                'created_at' => $purchase->created_at->format('M d h:i A'),
            ];
        })->values();

        // Get active variants with products and suppliers
        $productVariants = \App\Models\ProductVariant::with(['product', 'suppliers'])
            ->where('is_active', true)
            ->get();

        $suppliersByProduct = [];
        $products = [];

        foreach ($productVariants as $variant) {
            $variantSuppliers = $variant->suppliers->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'is_primary' => $s->pivot->is_primary,
                'lead_time_days' => $s->pivot->lead_time_days,
            ])->values();

            $suppliersByProduct[$variant->id] = ['suppliers' => $variantSuppliers];

            $products[] = [
                'id' => $variant->id,
                'product_name' => $variant->product?->name ?? '—',
                'variant_name' => $variant->variant_name ?? '',
            ];
        }

        return Inertia::render('InventoryPage/Purchases', [
            'purchases' => [
                'data' => $data,
                'meta' => [
                    'current_page' => $purchases->currentPage(),
                    'last_page' => $purchases->lastPage(),
                    'from' => $purchases->firstItem(),
                    'to' => $purchases->lastItem(),
                    'total' => $purchases->total(),
                ],
            ],
            'filters' => $request->only(['q', 'status', 'per']),
            'products' => $products,
            'suppliersByProduct' => $suppliersByProduct,
        ]);
    }

    public function show($id)
    {
        $purchase = Purchase::with(['supplier', 'items.productVariant.product'])
            ->findOrFail($id);

        $data = [
            'id' => $purchase->id,
            'reference_no' => $purchase->purchase_number,
            'supplier_name' => $purchase->supplier->name ?? '—',
            'status' => $purchase->status,
            'ordered_at' => $purchase->ordered_at,
            'received_at' => $purchase->received_at,
            'subtotal' => (float) $purchase->subtotal,
            'grand_total' => (float) $purchase->grand_total,

            'items' => $purchase->items->map(function ($item) {
                return [
                    'product_name' => $item->productVariant->product->name ?? '—',
                    'variant' => $item->productVariant->name ?? '—',
                    'qty' => (float) $item->qty,
                    'unit_cost' => (float) $item->unit_cost,
                    'line_total' => (float) $item->line_total,
                    'received_qty' => (float) ($item->received_qty ?? 0),
                ];
            }),
        ];

        return Inertia::render('InventoryPage/ViewPurchaseModal', [
            'purchase' => $data,
        ]);
    }
}
