<?php

namespace App\Repositories;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\InventoryBalance;
use App\Models\StockMovement;
use Carbon\Carbon;
use InvalidArgumentException;

class PurchaseRepository
{
    private const PROTECTED_STATUSES = [
        'completed',
        'paid',
        'received',
    ];

    public function getPaginatedPurchases(array $filters, int $perPage)
    {
        $query = Purchase::with([
            'supplier',
            'items.productVariant.product'
        ]);

        if (!empty($filters['q'])) {
            $q = $filters['q'];
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

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        return $query->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(int $id)
    {
        return Purchase::with(['supplier', 'items.productVariant.product'])
            ->findOrFail($id);
    }

    public function createPurchase(array $data)
    {
        if (!isset($data['created_by_user_id'])) {
            throw new InvalidArgumentException('created_by_user_id is required when creating a purchase.');
        }

        return Purchase::create($data);
    }

    public function updatePurchase(Purchase $purchase, array $data)
    {
        return $purchase->update($data);
    }

    public function deletePurchase(Purchase $purchase)
    {
        $purchase->items()->delete();
        return $purchase->delete();
    }

    /**
     * Permanently delete all purchases that are not yet completed/paid/received.
     *
     * @return int The number of deleted purchases.
     */
    public function purgeAllPurchases(): int
    {
        $query = Purchase::query()->whereNotIn('status', self::PROTECTED_STATUSES);
        $purchaseIds = $query->pluck('id')->all();

        if (empty($purchaseIds)) {
            return 0;
        }

        StockMovement::where('reference_type', Purchase::class)
            ->whereIn('reference_id', $purchaseIds)
            ->delete();

        PurchaseItem::whereIn('purchase_id', $purchaseIds)->delete();

        return $query->delete();
    }

    public function generatePurchaseNumber(): string
    {
        $lastPurchase = Purchase::orderBy('id', 'desc')->lockForUpdate()->first();
        
        if ($lastPurchase && preg_match('/P-(\d+)/', $lastPurchase->purchase_number, $matches)) {
            $nextNumber = (int)$matches[1] + 1;
        } else {
            $nextNumber = 1;
        }
        
        return 'P-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    public function createPurchaseItem(Purchase $purchase, array $data)
    {
        return $purchase->items()->create($data);
    }

    public function updatePurchaseItem(PurchaseItem $item, array $data)
    {
        return $item->update($data);
    }

    public function createStockMovement(array $data)
    {
        return StockMovement::create($data);
    }

    public function updateOrCreateInventoryBalance(int $locationId, int $productVariantId, float $qty)
    {
        $balance = InventoryBalance::firstOrCreate(
            [
                'location_id' => $locationId,
                'product_variant_id' => $productVariantId,
            ],
            [
                'qty_filled' => 0,
                'qty_empty' => 0,
                'qty_reserved' => 0,
                'reorder_level' => 0,
            ]
        );

        $balance->qty_filled += $qty;
        $balance->save();

        return $balance;
    }

    public function getProductVariantsWithSuppliers()
    {
        return \App\Models\ProductVariant::with(['product.supplier', 'suppliers'])
            ->where('is_active', true)
            ->get();
    }
}
