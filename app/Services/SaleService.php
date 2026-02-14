<?php

namespace App\Services;

use App\Repositories\SaleRepository;
use Carbon\Carbon;
use Illuminate\Support\Collection;

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
                $saleDatetime = $sale->sale_datetime ? Carbon::parse($sale->sale_datetime) : null;

                $dateLabel = $saleDatetime ? $saleDatetime->format('M d, Y') : null;
                $timeLabel = $saleDatetime ? $saleDatetime->format('g:i A') : null;

                return [
                    'id' => $sale->id,
                    'ref' => $sale->sale_number,
                    'customer' => $sale->customer?->name ?? 'Walk in',
                    'cashier_name' => $sale->cashier?->name ?? 'System',
                    'total' => $sale->grand_total,
                    'subtotal' => $sale->subtotal,
                    'net_amount' => $sale->net_amount,
                    'vat_amount' => $sale->vat_amount,
                    'gross_amount' => $sale->gross_amount,
                    'vat_treatment' => $sale->vat_treatment,
                    'vat_rate' => $sale->vat_rate,
                    'vat_inclusive' => $sale->vat_inclusive,
                    'vat_applied' => $sale->vat_applied,
                    'method' => $payment?->paymentMethod?->method_key ?? 'cash',
                    'status' => $sale->status,
                    'created_at' => $sale->created_at->format('M d, Y g:i A'),
                    'amount_received' => $sale->cash_tendered,
                    'change' => $sale->cash_change,
                    'payment_ref' => $payment?->reference_no,
                    'discount' => $sale->discount_total,
                    'date' => $dateLabel,
                    'time' => $timeLabel,
                    'date_label' => $dateLabel,
                    'time_label' => $timeLabel,
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
            })->toArray(),
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

    public function getSalesForExport(array $filters = []): Collection
    {
        return $this->repo->getForExport($filters);
    }
}
