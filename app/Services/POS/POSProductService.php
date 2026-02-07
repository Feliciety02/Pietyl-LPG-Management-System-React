<?php

namespace App\Services\POS;

use App\Repositories\ProductRepository;
use App\Services\SettingsService;

class POSProductService
{
    public function __construct(
        private ProductRepository $productRepository
    ) {}

    public function getProductsForPOS(): array
    {
        $variants = $this->productRepository->getActiveVariantsWithProducts();

        if ($variants->isEmpty()) {
            return [];
        }

        $priceListPrices = $this->getPriceListPrices($variants->pluck('id')->toArray());
        $inventoryBalances = $this->productRepository->getInventoryBalances($variants->pluck('id')->toArray());

        return $variants->map(function ($variant) use ($priceListPrices, $inventoryBalances) {
            $basePrice = $this->getVariantPrice($variant, $priceListPrices);

            return [
                'id'           => $variant->id,
                'name'         => $variant->product->name ?? 'Unknown',
                'variant'      => $variant->variant_name,
                'category'     => $variant->product->category ?? 'lpg',
                'price_refill' => $basePrice,
                'price_swap'   => $basePrice * 1.25,
                'stock_qty'    => $inventoryBalances[$variant->id] ?? 0,
            ];
        })->toArray();
    }

    private function getPriceListPrices(array $variantIds): array
    {
        $priceListId = $this->productRepository->getActivePriceList();

        if (!$priceListId) {
            return [];
        }

        return $this->productRepository->getPriceListPrices($priceListId, $variantIds);
    }

    private function getVariantPrice($variant, array $priceListPrices): float
    {
        $basePrice = $variant->product?->price ?? 0;
        
        if (isset($priceListPrices[$variant->id])) {
            $basePrice = $priceListPrices[$variant->id];
        }

        return (float) $basePrice;
    }
}