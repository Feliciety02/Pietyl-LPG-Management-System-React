<?php

namespace App\Services;

use App\Models\InventoryBalance;
use App\Models\ProductVariant;
use App\Models\RestockRequestItem;
use App\Repositories\InventoryBalanceRepository;
use Illuminate\Pagination\LengthAwarePaginator;

class InventoryBalanceService
{
    protected InventoryBalanceRepository $repo;

    public function __construct()
    {
        $this->repo = new InventoryBalanceRepository();
    }

    /**
     * Get paginated stock counts for the count page
     */
    public function MapDataForCountPage()
    {
        $perPage = request()->input('per', 10);

        return $this->repo
            ->allWithRelationsPaginated($perPage)
            ->through(function ($balance) {
                return [
                    'id' => $balance->id,
                    'location_id' => $balance->location_id,
                    'location_name' => $balance->location->name ?? null,
                    'sku' => $balance->productVariant->product->sku ?? null,
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
    }

   
    public function adjustStock(InventoryBalance $balance, array $validated)
    {
        $this->repo->updateInventory($balance, $validated);

        // TODO: Add stock movement logging here
    }

    public function getLowStock(array $filters = [])
    {
        $perPage = (int) ($filters['per'] ?? 10);
        $page = (int) ($filters['page'] ?? 1);
        $q = trim((string) ($filters['q'] ?? ''));
        $riskFilter = (string) ($filters['risk'] ?? 'all');
        $reqFilter = (string) ($filters['req'] ?? 'all');

        $query = InventoryBalance::query()
            ->with(['productVariant.product', 'location', 'productVariant.suppliers'])
            ->whereRaw('(qty_filled + qty_empty - qty_reserved) <= reorder_level');

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->whereHas('productVariant.product', function ($p) use ($q) {
                    $p->where('name', 'like', "%{$q}%")
                      ->orWhere('sku', 'like', "%{$q}%");
                })->orWhereHas('productVariant', function ($p) use ($q) {
                    $p->where('variant_name', 'like', "%{$q}%");
                })->orWhereHas('productVariant.suppliers', function ($s) use ($q) {
                    $s->where('name', 'like', "%{$q}%");
                });
            });
        }

        $balances = $query->get();

        $variantIds = $balances->pluck('product_variant_id')->unique()->values();
        $locationIds = $balances->pluck('location_id')->unique()->values();

        $latestItems = RestockRequestItem::query()
            ->whereIn('product_variant_id', $variantIds)
            ->whereHas('restockRequest', function ($q) use ($locationIds) {
                $q->whereIn('location_id', $locationIds);
            })
            ->with(['restockRequest.requestedBy'])
            ->orderByDesc('created_at')
            ->get();

        $latestByKey = [];
        foreach ($latestItems as $item) {
            $request = $item->restockRequest;
            if (!$request) {
                continue;
            }
            $key = $item->product_variant_id . '|' . $request->location_id;
            if (!isset($latestByKey[$key])) {
                $latestByKey[$key] = $item;
            }
        }

        $mapped = $balances->map(function ($balance) use ($latestByKey) {
                $available = $balance->qty_on_hand - $balance->qty_reserved;
                $reorderLevel = $balance->reorder_level;

                $riskLevel = ($available <= $reorderLevel * 0.25) ? 'critical' : 'warning';

                $primarySupplier = $balance->productVariant->suppliers()
                    ->wherePivot('is_primary', true)
                    ->first();
                $fallbackSupplier = $primarySupplier ?? $balance->productVariant->suppliers()->first();
                $supplierUnitCost = (float) ($fallbackSupplier?->pivot?->unit_cost ?? 0);

                $key = $balance->product_variant_id . '|' . $balance->location_id;
                $latestItem = $latestByKey[$key] ?? null;
                $latestRequest = $latestItem?->restockRequest;
                $requestedBy = $latestRequest?->requestedBy;

                return [
                    'id' => $balance->id,
                    'location_id' => $balance->location_id,
                    'location_name' => $balance->location->name ?? null,
                    'sku' => $balance->productVariant->product->sku ?? null,
                    'name' => $balance->productVariant->product->name ?? null,
                    'variant' => $balance->productVariant->variant_name ?? null,
                    'product_variant_id' => $balance->product_variant_id,
                    'supplier_id' => $fallbackSupplier?->id,
                    'supplier_name' => $fallbackSupplier?->name ?? '—',
                    'supplier_unit_cost' => $supplierUnitCost,
                    'current_qty' => $available,
                    'reorder_level' => $reorderLevel,
                    'est_days_left' => rand(1, 5),
                    'risk_level' => $riskLevel,
                    'last_movement_at' => $balance->updated_at?->format('M d, Y h:i A'),
                    'purchase_request_id' => $latestRequest?->id,
                    'purchase_request_status' => $latestRequest?->status,
                    'requested_by_name' => $requestedBy?->name,
                    'requested_at' => $latestRequest?->created_at?->format('M d, Y h:i A'),
                ];
            });

        $filtered = $mapped->filter(function ($row) use ($riskFilter, $reqFilter) {
            if ($riskFilter !== 'all' && $row['risk_level'] !== $riskFilter) {
                return false;
            }

            if ($reqFilter !== 'all') {
                $status = $row['purchase_request_status'] ?? 'none';
                if ($reqFilter === 'none') {
                    return $status === null || $status === 'none';
                }
                return $status === $reqFilter;
            }

            return true;
        })->values();

        $total = $filtered->count();
        $page = max(1, $page);
        $perPage = max(1, $perPage);
        $slice = $filtered->slice(($page - 1) * $perPage, $perPage)->values();

        $paginator = new LengthAwarePaginator(
            $slice,
            $total,
            $perPage,
            $page
        );

        // Build product hash
        $allVariants = ProductVariant::with(['product', 'suppliers'])->get();
        $productHash = [];
        $suppliersByProduct = [];
        $products = [];
        foreach ($allVariants as $variant) {
            $key = $variant->product->name . '|' . $variant->variant_name;

            $primarySupplier = $variant->suppliers()->wherePivot('is_primary', true)->first();

            if (!isset($productHash[$key])) {
                $productHash[$key] = [
                    'id' => $variant->id,
                    'sku' => $variant->product->sku,
                    'name' => $variant->product->name,
                    'variant' => $variant->variant_name,
                    'default_supplier_id' => $primarySupplier?->id,
                    'supplier_ids' => $variant->suppliers->pluck('id')->toArray(),
                ];
            } else {
                $productHash[$key]['supplier_ids'] = array_unique(array_merge(
                    $productHash[$key]['supplier_ids'],
                    $variant->suppliers->pluck('id')->toArray()
                ));
            }

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
            'low_stock' => [
                'data' => $paginator->items(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'from' => $paginator->firstItem(),
                    'to' => $paginator->lastItem(),
                    'total' => $paginator->total(),
                    'per_page' => $paginator->perPage(),
                ],
            ],
            'product_hash' => array_values($productHash),
            'suppliers' => \App\Models\Supplier::where('is_active', true)->get(['id', 'name']),
            'suppliersByProduct' => $suppliersByProduct,
            'products' => $products,
        ];
    }
}
