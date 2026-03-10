<?php

namespace App\Services;

use App\Repositories\SaleRepository;
use App\Models\Receipt;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

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

    public function findOrCreateReceiptForSale(int $saleId): ?Receipt
    {
        $receipt = $this->repo->findReceiptBySaleId($saleId);

        if ($receipt) return $receipt;

        try {
            return $this->repo->createReceipt($saleId);
        } catch (\Throwable $e) {
            Log::error('Failed to create receipt via Eloquent', [
                'sale_id' => $saleId,
                'error'   => $e->getMessage(),
            ]);
        }

        try {
            return $this->repo->createReceiptRaw($saleId);
        } catch (\Throwable $e) {
            Log::error('Failed to create receipt via raw insert', [
                'sale_id' => $saleId,
                'error'   => $e->getMessage(),
            ]);
        }

        return null;
    }

    public function incrementReceiptPrintCount(?Receipt $receipt): void
    {
        if (! $receipt) return;

        try {
            $this->repo->incrementPrintedCount($receipt);
        } catch (\Throwable $e) {
            Log::error('Failed to increment printed_count', [
                'receipt_id' => $receipt->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }


    public function buildReceiptPayload(Sale $sale): array
    {
        $sale->load(['items.productVariant.product', 'payments.paymentMethod', 'receipt', 'customer']);

        $saleDatetime = $sale->sale_datetime ? Carbon::parse($sale->sale_datetime) : null;
        $payment      = $sale->payments->first();

        return [
            'id'             => $sale->id,
            'ref'            => $sale->receipt?->receipt_number ?? $sale->sale_number,
            'date'           => $saleDatetime?->format('M d, Y'),
            'time'           => $saleDatetime?->format('g:i A'),
            'date_label'     => $saleDatetime?->format('M d, Y'),
            'time_label'     => $saleDatetime?->format('g:i A'),
            'lines'          => $sale->items->map(fn($item) => [
                'name'       => $item->productVariant?->product?->name ?? $item->product_name ?? 'Item',
                'variant'    => $item->productVariant?->variant_name ?? null,
                'qty'        => $item->qty,
                'unit_price' => $item->unit_price,
            ])->toArray(),
            'subtotal'        => $sale->subtotal,
            'discount'        => $sale->discount_total,
            'net_amount'      => $sale->net_amount,
            'vat_amount'      => $sale->vat_amount,
            'gross_amount'    => $sale->gross_amount ?? $sale->grand_total,
            'vat_treatment'   => $sale->vat_treatment,
            'vat_inclusive'   => $sale->vat_inclusive,
            'method'          => $payment?->paymentMethod?->method_key ?? 'cash',
            'payment_ref'     => $payment?->reference_no,
            'amount_received' => $sale->cash_tendered,
            'change'          => $sale->cash_change,
            'company_phone'   => config('app.company_phone'),
            'company_address' => config('app.company_address'),
            'company_tin'     => config('app.company_tin'),
            'printed_count'   => $sale->receipt?->printed_count ?? 0,
        ];
    }

    public function buildExportSummary(Collection $sales): array
    {
        return [
            'count'     => $sales->count(),
            'total'     => $sales->sum('grand_total'),
            'net_total' => $sales->sum('net_amount'),
            'vat_total' => $sales->sum('vat_amount'),
        ];
    }

    public function buildMethodTotals(Collection $sales): array
    {
        return $sales
            ->flatMap(fn($sale) => $sale->payments->map(fn($payment) => [
                'method' => $payment->paymentMethod?->method_key ?? 'cash',
                'amount' => $payment->amount,
            ]))
            ->groupBy('method')
            ->map(fn($items) => $items->sum('amount'))
            ->toArray();
    }

    public function resolveStatusLabel(string $statusScope): string
    {
        return [
            'paid'         => 'Paid only',
            'paid_pending' => 'Paid + Pending',
            'pending'      => 'Pending only',
            'failed'       => 'Failed only',
            'all'          => 'All statuses',
        ][$statusScope] ?? 'Paid only';
    }
}
