<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use App\Exceptions\PurchaseStatusException;
use App\Models\Purchase;
use App\Services\Inventory\PurchaseService;
use App\Enums\PurchaseStatus;
use Illuminate\Support\Facades\DB;


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
            'canDeleteAll' => $request->user()?->can('inventory.purchases.delete_all'),
            'canDeletePurchase' => $request->user()?->can('inventory.purchases.delete'),
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

        try {
            DB::transaction(function () use ($validated, $user) {
                $this->purchaseService->createPurchase($validated, $user);
            });
        } catch (PurchaseStatusException $ex) {
            return redirect()->back()->with('error', $ex->getMessage())->setStatusCode(422);
        }

        return redirect()->back()->with('success', 'Purchase order created successfully');
    }

    public function approve(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.approve')) {
            abort(403);
        }

        try {
            $actorRole = $this->resolveActorRole($user);
            $this->purchaseService->approvePurchase($purchase, $actorRole, $user);
        } catch (PurchaseStatusException $ex) {
            return back()->with('error', $ex->getMessage())->setStatusCode(422);
        }

        return back()->with('success', 'Purchase approved.');
    }

    public function reject(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.approve')) {
            abort(403);
        }

        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:500',
        ]);

        try {
            $actorRole = $this->resolveActorRole($user);
            $this->purchaseService->rejectPurchase($purchase, $actorRole, $validated['reason'], $user);
        } catch (PurchaseStatusException $ex) {
            return back()->with('error', $ex->getMessage())->setStatusCode(422);
        }

        return back()->with('success', 'Purchase rejected.');
    }

    public function markDelivered(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (
            !$user ||
            !(
                $user->hasRole('inventory_manager') ||
                $user->can('inventory.purchases.mark_delivered')
            )
        ) {
            return response()->json(['message' => 'You are not allowed to confirm delivery arrivals.'], 403);
        }

        $requiresSupplierReference = config('inventory.cod_auto_pay', false);
        $validated = $request->validate([
            'delivered_qty' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'damaged_qty' => 'nullable|numeric|min:0',
            'damage_reason' => 'nullable|string',
            'damage_category' => 'nullable|string|max:100',
            'delivery_reference' => 'nullable|string|max:100',
            'supplier_reference' => ($requiresSupplierReference ? 'required' : 'nullable') . '|string|max:100',
        ]);

        $actorRole = $this->resolveActorRole($user);
        $nextStatus = PurchaseStatus::RECEIVED;
        $currentStatus = $purchase->status;

        $canTransition = PurchaseStatus::canTransition($currentStatus, $nextStatus);
        $actorCanTransition = PurchaseStatus::actorCanTransition($actorRole, $currentStatus, $nextStatus);

        try {
            PurchaseStatus::ensureTransition($currentStatus, $nextStatus, $actorRole);
        } catch (PurchaseStatusException $ex) {
            $statusCode = !$canTransition ? 422 : (!$actorCanTransition ? 403 : 422);
            return response()->json(['message' => $ex->getMessage()], $statusCode);
        }

        try {
            $this->purchaseService->markDelivered($purchase, $validated, $user);
        } catch (PurchaseStatusException $ex) {
            return response()->json(['message' => $ex->getMessage()], 422);
        }

        return response()->json(['message' => 'Purchase marked as received.']);
    }

    public function confirm(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.confirm')) {
            abort(403);
        }

        $requiresReference = config('inventory.require_supplier_reference', false);
        $validated = $request->validate([
            'received_qty' => 'required|numeric|min:0',
            'reference_no' => ($requiresReference ? 'required' : 'nullable') . '|string|max:100',
            'notes' => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($purchase, $validated, $user) {
                $this->purchaseService->confirmPurchase($purchase, $validated, $user);
            });
        } catch (PurchaseStatusException $ex) {
            return back()->with('error', $ex->getMessage())->setStatusCode(422);
        }

        return back()->with('success', 'Purchase confirmed.');
    }

    public function discrepancy(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.confirm')) {
            abort(403);
        }

        try {
            $actorRole = $this->resolveActorRole($user);
            $this->purchaseService->reportDiscrepancy($purchase, $actorRole, $user);
        } catch (PurchaseStatusException $ex) {
            return back()->with('error', $ex->getMessage())->setStatusCode(422);
        }

        return back()->with('success', 'Discrepancy reported.');
    }

    public function complete(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.confirm')) {
            abort(403);
        }

        try {
            $this->resolveActorRole($user);
            $this->purchaseService->completePurchase($purchase, $user);
        } catch (PurchaseStatusException | ValidationException $ex) {
            $message = $ex->getMessage();
            if ($ex instanceof ValidationException) {
                $statusErrors = Arr::get($ex->errors(), 'status');
                $message = Arr::first($statusErrors) ?? $message;
            }

            return back()->with('error', $message)->setStatusCode(422);
        }

        return back()->with('success', 'Purchase completed.');
    }

    public function pay(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->can('accountant.payables.pay')) {
            abort(403);
        }

        $validated = $request->validate([
            'amount' => 'nullable|numeric|min:0',
            'reference' => 'nullable|string|max:100',
            'payment_method' => 'nullable|string|max:50',
        ]);

        try {
            $actorRole = $this->resolveActorRole($user);

            DB::transaction(function () use ($purchase, $validated, $user, $actorRole) {
                $this->purchaseService->recordPayment($purchase, $validated, $user, $actorRole);
            });
        } catch (PurchaseStatusException $ex) {
            return back()->with('error', $ex->getMessage())->setStatusCode(422);
        }

        return back()->with('success', 'Payment recorded.');
    }

    public function close(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->hasRole('finance')) {
            abort(403);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        try {
            $actorRole = $this->resolveActorRole($user);
            $normalizedRole = PurchaseStatus::normalizeRole($actorRole);
            if ($normalizedRole !== PurchaseStatus::ROLE_FINANCE) {
                abort(403);
            }

            PurchaseStatus::ensureTransition($purchase->status, PurchaseStatus::CLOSED, PurchaseStatus::ROLE_FINANCE);
            $this->purchaseService->closePurchase($purchase, $actorRole, $validated);
        } catch (PurchaseStatusException $ex) {
            return back()->with('error', $ex->getMessage())->setStatusCode(422);
        }

        return back()->with('success', 'Purchase closed.');
    }

    public function destroy(Request $request, Purchase $purchase)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.delete')) {
            abort(403);
        }

        $this->purchaseService->deletePurchase($purchase);

        return back()->with('success', 'Purchase deleted.');
    }

    public function purge(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('inventory.purchases.delete_all')) {
            abort(403);
        }

        try {
            $deleted = $this->purchaseService->purgeAllPurchases();
        } catch (\Throwable $e) {
            report($e);
            return back()->with('error', 'Failed to clear purchase history.');
        }

        if ($deleted === 0) {
            return back()->with('info', 'No eligible purchases to delete.');
        }

        return back()->with('success', "{$deleted} purchase(s) cleared.");
    }

    private function resolveActorRole(Authenticatable $user): string
    {
        $role = $user->getRoleNames()->first();

        if (!$role) {
            abort(403, 'A role assignment is required to approve purchases.');
        }

        return $role;
    }
}
