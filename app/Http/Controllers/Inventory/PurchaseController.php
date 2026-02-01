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
        $query = $this->buildPurchaseQuery($request);
        
        $perPage = $request->per ?? 10;
        $purchases = $query->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        $data = $this->transformPurchasesForIndex($purchases->getCollection());
        
        $productsData = $this->getProductsWithSuppliers();

        return Inertia::render('InventoryPage/Purchases', [
            'purchases' => [
                'data' => $data,
                'meta' => $this->getPaginationMeta($purchases),
            ],
            'filters' => $request->only(['q', 'status', 'per']),
            'products' => $productsData['products'],
            'suppliersByProduct' => $productsData['suppliersByProduct'],
        ]);
    }

    public function show($id)
    {
        $purchase = Purchase::with(['supplier', 'items.productVariant.product'])
            ->findOrFail($id);

        $data = $this->transformPurchaseForShow($purchase);

        return Inertia::render('InventoryPage/ViewPurchaseModal', [
            'purchase' => $data,
        ]);
    }

    /**
     * Build the purchase query with filters
     */
    protected function buildPurchaseQuery(Request $request)
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

        return $query;
    }

    /**
     * Transform purchases collection for index view
     */
    protected function transformPurchasesForIndex($purchases)
    {
        return $purchases->map(function ($purchase) {
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
    }

    /**
     * Transform purchase for show view
     */
    protected function transformPurchaseForShow($purchase)
    {
        return [
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
    }

    /**
     * Get products with their suppliers
     */
    protected function getProductsWithSuppliers()
    {
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
                'unit_cost' => (float) ($s->pivot->unit_cost ?? 0),
            ])->values();

            $suppliersByProduct[$variant->id] = ['suppliers' => $variantSuppliers];

            $products[] = [
                'id' => $variant->id,
                'product_name' => $variant->product?->name ?? '—',
                'variant_name' => $variant->variant_name ?? '',
            ];
        }

        return [
            'products' => $products,
            'suppliersByProduct' => $suppliersByProduct,
        ];
    }

    /**
     * Get pagination metadata
     */
    protected function getPaginationMeta($paginator)
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'total' => $paginator->total(),
        ];
    }

    /**
     * Store a new purchase
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.create')) {
            abort(403);
        }

        // $validated = $request->validate([
        //     'product_variant_id' => 'required|exists:product_variants,id',
        //     'supplier_id' => 'required|exists:suppliers,id',
        //     'qty' => 'required|numeric|min:1',
        //     'notes' => 'nullable|string',
        // ]);

        $validated = $request->all();

        \DB::transaction(function () use ($validated, $user) {
            // Generate sequential purchase number
            $lastPurchase = Purchase::orderBy('id', 'desc')->lockForUpdate()->first();
            
            if ($lastPurchase && preg_match('/P-(\d+)/', $lastPurchase->purchase_number, $matches)) {
                $nextNumber = (int)$matches[1] + 1;
            } else {
                $nextNumber = 1;
            }
            
            $purchaseNumber = 'P-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            // Get unit cost from request
            $unitCost = $validated['unit_cost'] ?? 0;
            $lineTotal = $validated['qty'] * $unitCost;

            // Set status based on user role
            $status = $user->hasRole('admin') ? 'awaiting_confirmation' : 'pending';

            // Create purchase
            $purchase = Purchase::create([
                'purchase_number' => $purchaseNumber,
                'supplier_id' => $validated['supplier_id'],
                'created_by_user_id' => auth()->id(),
                'status' => $status,
                'subtotal' => $lineTotal,
                'grand_total' => $lineTotal,
                'notes' => $validated['notes'] ?? null,
                'ordered_at' => now(),
            ]);

            // Create purchase item
            $purchase->items()->create([
                'product_variant_id' => $validated['product_variant_id'],
                'qty' => $validated['qty'],
                'received_qty' => 0,
                'unit_cost' => $unitCost,
                'line_total' => $lineTotal,
            ]);
        });

        return redirect()->back()->with('success', 'Purchase order created successfully');
    }
}