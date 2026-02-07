<?php

namespace App\Repositories;

use App\Models\ProductVariant;
use App\Models\InventoryBalance;
use App\Models\Location;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProductRepository
{
    public function getActiveVariantsWithProducts(): Collection
    {
        return ProductVariant::with('product')
            ->where('is_active', 1)
            ->whereHas('product', function ($q) {
                $q->where('is_active', true);
            })
            ->get();
    }

    public function getActivePriceList(): ?int
    {
        if (!Schema::hasTable('price_lists')) {
            return null;
        }

        return DB::table('price_lists')
            ->where('is_active', 1)
            ->orderByDesc('starts_at')
            ->orderByDesc('created_at')
            ->value('id');
    }

    public function getPriceListPrices(int $priceListId, array $variantIds): array
    {
        if (!Schema::hasTable('price_list_items')) {
            return [];
        }

        return DB::table('price_list_items')
            ->where('price_list_id', $priceListId)
            ->whereIn('product_variant_id', $variantIds)
            ->pluck('price', 'product_variant_id')
            ->toArray();
    }

    public function getInventoryBalances(array $variantIds): array
    {
        return DB::table('inventory_balances')
            ->whereIn('product_variant_id', $variantIds)
            ->select('product_variant_id', DB::raw('SUM(CAST(qty_filled AS UNSIGNED)) as total_qty_filled'))
            ->groupBy('product_variant_id')
            ->pluck('total_qty_filled', 'product_variant_id')
            ->map(fn($qty) => (int) $qty)
            ->toArray();
    }

    public function findVariantById(int $id): ?ProductVariant
    {
        return ProductVariant::find($id);
    }
}