<?php

namespace App\Services;

use App\Models\InventoryBalance;
use App\Models\ProductVariant;
use App\Models\RestockRequestItem;
use App\Repositories\InventoryBalanceRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;


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
        $scope = (string) ($filters['scope'] ?? 'low');
        $showAll = $scope === 'all';

        // Aggregate inventory across all locations per variant
        $query = DB::table('inventory_balances as ib')
            ->select([
                'pv.id as product_variant_id',
                'p.id as product_id',
                'p.sku',
                'p.name as product_name',
                'pv.variant_name',
                DB::raw('SUM(ib.qty_filled) as total_qty_filled'),
                DB::raw('SUM(ib.qty_empty) as total_qty_empty'),
                DB::raw('SUM(ib.qty_reserved) as total_qty_reserved'),
                DB::raw('MAX(ib.reorder_level) as max_reorder_level'),
                DB::raw('MAX(ib.updated_at) as last_updated'),
            ])
            ->join('product_variants as pv', 'ib.product_variant_id', '=', 'pv.id')
            ->join('products as p', 'pv.product_id', '=', 'p.id');

        if (!$showAll) {
            $query->where('ib.reorder_level', '>', 0);
        }

        $query->groupBy('pv.id', 'p.id', 'p.sku', 'p.name', 'pv.variant_name');

        if (!$showAll) {
            $query->havingRaw('(SUM(ib.qty_filled) + SUM(ib.qty_empty) - SUM(ib.qty_reserved)) <= MAX(ib.reorder_level)');
        }

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('p.name', 'like', "%{$q}%")
                    ->orWhere('p.sku', 'like', "%{$q}%")
                    ->orWhere('pv.variant_name', 'like', "%{$q}%");
            });
        }

        $results = $query->get();

        // Debug logging
        \Log::info('Low stock aggregated results:', [
            'total_found' => $results->count(),
            'sample' => $results->take(3)->map(fn($r) => [
                'variant_id' => $r->product_variant_id,
                'name' => $r->product_name,
                'available' => ($r->total_qty_filled + $r->total_qty_empty - $r->total_qty_reserved),
                'reorder_level' => $r->max_reorder_level,
            ])
        ]);

        $variantIds = collect($results)->pluck('product_variant_id')->unique()->values();

        // Get latest restock request per variant (across all locations)
        $latestItems = RestockRequestItem::query()
            ->whereIn('product_variant_id', $variantIds)
            ->with(['restockRequest.requestedBy'])
            ->orderByDesc('created_at')
            ->get();

        $latestByVariant = [];
        foreach ($latestItems as $item) {
            $request = $item->restockRequest;
            if (!$request) {
                continue;
            }
            $key = $item->product_variant_id;
            if (!isset($latestByVariant[$key])) {
                $latestByVariant[$key] = $item;
            }
        }

        // Get primary suppliers for variants
        $suppliers = DB::table('supplier_products as sp')
            ->whereIn('sp.product_variant_id', $variantIds)
            ->where('sp.is_primary', true)
            ->join('suppliers as s', 'sp.supplier_id', '=', 's.id')
            ->select([
                'sp.product_variant_id',
                's.id as supplier_id',
                's.name as supplier_name',
            ])
            ->get()
            ->keyBy('product_variant_id');

        $mapped = collect($results)->map(function ($row) use ($latestByVariant, $suppliers, $scope) {
            $available = ($row->total_qty_filled + $row->total_qty_empty) - $row->total_qty_reserved;
            $reorderLevel = $row->max_reorder_level;

            if ($reorderLevel <= 0) {
                $riskLevel = 'ok';
            } else {
                $ratio = $available / $reorderLevel;
                if ($ratio <= 0.5) {
                    $riskLevel = 'critical';
                } elseif ($ratio < 1) {
                    $riskLevel = 'warning';
                } else {
                    $riskLevel = 'ok';
                }
            }

            $supplier = $suppliers->get($row->product_variant_id);
            
            $latestItem = $latestByVariant[$row->product_variant_id] ?? null;
            $latestRequest = $latestItem?->restockRequest;
            $requestedBy = $latestRequest?->requestedBy;

            return [
                'id' => $row->product_variant_id, // Use variant ID as unique identifier
                'location_id' => null, // Combined across all locations
                'location_name' => 'All Locations',
                'sku' => $row->sku,
                'name' => $row->product_name,
                'variant' => $row->variant_name,
                'product_variant_id' => $row->product_variant_id,
                'supplier_id' => $supplier?->supplier_id,
                'supplier_name' => $supplier?->supplier_name ?? '—',
                'current_qty' => $available,
                'reorder_level' => $reorderLevel,
                'est_days_left' => rand(1, 5),
                'risk_level' => $riskLevel,
                'scope' => $scope,
                'last_movement_at' => \Carbon\Carbon::parse($row->last_updated)->format('M d, Y h:i A'),
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
            'scope' => $scope,
        ];
    }
}
