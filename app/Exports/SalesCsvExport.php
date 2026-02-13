<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\FromArray;

class SalesCsvExport implements FromArray
{
    public function __construct(
        protected Collection $sales,
        protected array $methodTotals,
        protected array $summary,
        protected string $rangeLabel,
        protected string $statusLabel
    ) {}

    public function array(): array
    {
        $rows = [
            ['Sales Report'],
            [$this->rangeLabel, '', '', '', '', '', 'Status scope:', $this->statusLabel],
            [],
            ['Date', 'Time', 'Sale #', 'Customer', 'Status', 'Method', 'Reference', 'Net', 'VAT', 'Gross'],
        ];

        foreach ($this->sales as $sale) {
            $payment = $sale->payments->first();
            $method = $payment?->paymentMethod?->name ?? $payment?->paymentMethod?->method_key ?? 'Cash';

            $rows[] = [
                optional($sale->sale_datetime)->format('Y-m-d'),
                optional($sale->sale_datetime)->format('H:i'),
                $sale->sale_number,
                $sale->customer?->name ?? 'Walk in',
                Str::upper($sale->status),
                Str::title($method),
                $payment?->reference_no ?? $sale->sale_number,
                $sale->net_amount,
                $sale->vat_amount,
                $sale->gross_amount,
            ];
        }

        $rows[] = [];
        $rows[] = ['Summary'];
        $rows[] = ['Total transactions', $this->summary['count'] ?? 0];
        $rows[] = ['Net sales total', $this->summary['net_total'] ?? 0];
        $rows[] = ['VAT total', $this->summary['vat_total'] ?? 0];
        $rows[] = ['Gross sales total', $this->summary['total'] ?? 0];

        foreach ($this->methodTotals as $method => $amount) {
            $rows[] = [Str::title($method) . ' total', $amount];
        }

        return $rows;
    }
}
