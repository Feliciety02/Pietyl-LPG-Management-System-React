<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Purchase;
use App\Services\Inventory\PurchaseService;

class PurchaseController extends Controller
{
    public function __construct(
        private PurchaseService $purchaseService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only(['q', 'status']);
        $perPage = $request->per ?? 10;

        $purchases = $this->purchaseService->getPurchasesForIndex($filters, $perPage);
        $productsData = $this->purchaseService->getProductsWithSuppliers();
        $mapsData = $this->purchaseService->getProductSupplierMaps();

        return Inertia::render('InventoryPage/Purchases', [
            'purchases' => $purchases,
            'filters' => array_merge($filters, ['per' => $perPage]),
            'products' => $productsData['products'],
            'suppliersByProduct' => $productsData['suppliersByProduct'],
            'productsMap' => $mapsData['productsMap'],
            'suppliersMap' => $mapsData['suppliersMap'],
        ]);
    }

    public function show($id)
    {
        $purchase = $this->purchaseService->getPurchaseDetails($id);

        return Inertia::render('InventoryPage/ViewPurchaseModal', [
            'purchase' => $purchase,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.create')) {
            abort(403);
        }

        $validated = $request->validate([
            'product_variant_id' => 'required|exists:product_variants,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'qty' => 'required|numeric|min:1',
            'unit_cost' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        \DB::transaction(function () use ($validated, $user) {
            $this->purchaseService->createPurchase($validated, $user);
        });

        return redirect()->back()->with('success', 'Purchase order created successfully');
    }

    public function approve(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.approve')) {
            abort(403);
        }

        $this->purchaseService->approvePurchase($purchase);

        return back()->with('success', 'Purchase approved.');
    }

    public function reject(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.approve')) {
            abort(403);
        }

        $this->purchaseService->rejectPurchase($purchase);

        return back()->with('success', 'Purchase rejected.');
    }

    public function markDelivered(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.mark_delivered')) {
            abort(403);
        }

        $this->purchaseService->markDelivered($purchase);

        return back()->with('success', 'Purchase marked as delivered.');
    }

    public function confirm(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.confirm')) {
            abort(403);
        }

        $validated = $request->validate([
            'received_qty' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        \DB::transaction(function () use ($purchase, $validated, $user) {
            $this->purchaseService->confirmPurchase($purchase, $validated, $user);
        });

        return back()->with('success', 'Purchase confirmed.');
    }

    public function discrepancy(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.confirm')) {
            abort(403);
        }

        $this->purchaseService->reportDiscrepancy($purchase);

        return back()->with('success', 'Discrepancy reported.');
    }
}