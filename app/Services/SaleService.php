<?php

namespace App\Services;

use App\Repositories\SaleRepository;

class SaleService
{
    protected SaleRepository $repo;

    public function __construct(SaleRepository $repo)
    {
        $this->repo = $repo;
    }

    public function getSalesForPage(array $filters = []): array
    {
        $salesPaginated = $this->repo->getPaginated($filters);

        return [
            'data' => collect($salesPaginated->items())->map(function ($sale) {
                $payment = $sale->payments->first();

                return [
                    'id' => $sale->id,
                    'ref' => $sale->sale_number,
                    'customer' => $sale->customer?->name ?? 'Walk in',
                    'total' => $sale->grand_total,
                    'method' => $payment?->paymentMethod?->method_key ?? 'cash',
                    'status' => $sale->status,
                    'created_at' => $sale->sale_datetime->format('M d, Y g:i A'),
                    'lines' => $sale->items->map(function ($item) {
                        return [
                            'name' => $item->productVariant->product->name,
                            'variant' => $item->productVariant->variant_name,
                            'mode' => $item->pricing_source === 'manual' ? 'swap' : 'refill',
                            'qty' => $item->qty,
                            'unit_price' => $item->unit_price,
                        ];
                    })->toArray(),
                ];
            }),
            'meta' => [
                'current_page' => $salesPaginated->currentPage(),
                'last_page' => $salesPaginated->lastPage(),
                'from' => $salesPaginated->firstItem(),
                'to' => $salesPaginated->lastItem(),
                'total' => $salesPaginated->total(),
                'per_page' => $salesPaginated->perPage(),
            ],
        ];
    }
}
