<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesReportExport implements WithMultipleSheets
{
    public function __construct(
        protected Collection $sales,
        protected array $methodTotals,
        protected array $summary,
        protected string $rangeLabel,
        protected string $statusLabel,
        protected bool $includeItems
    ) {}

    public function sheets(): array
    {
        $sheets = [
            new SalesSheet(
                $this->sales,
                $this->methodTotals,
                $this->summary,
                $this->rangeLabel,
                $this->statusLabel
            ),
        ];

        if ($this->includeItems) {
            $sheets[] = new ItemsSheet($this->sales);
        }

        return $sheets;
    }
}

class SalesSheet implements FromArray, ShouldAutoSize, WithStyles, WithColumnFormatting, WithEvents, WithTitle
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
        $rows[] = ['Net sales total', null, null, null, null, null, null, $this->summary['net_total'] ?? 0];
        $rows[] = ['VAT total', null, null, null, null, null, null, null, $this->summary['vat_total'] ?? 0];
        $rows[] = ['Gross sales total', null, null, null, null, null, null, null, null, $this->summary['total'] ?? 0];

        foreach ($this->methodTotals as $method => $amount) {
            $rows[] = [Str::title($method) . ' total', null, null, null, null, null, null, null, null, $amount];
        }

        return $rows;
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->getStyle('A4:J4')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E0F2FE']],
            'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN]],
        ]);

        return [];
    }

    public function columnFormats(): array
    {
        return [
            'A' => NumberFormat::FORMAT_DATE_YYYYMMDD2,
            'B' => NumberFormat::FORMAT_DATE_TIME4,
            'H' => NumberFormat::FORMAT_CURRENCY_PHP,
            'I' => NumberFormat::FORMAT_CURRENCY_PHP,
            'J' => NumberFormat::FORMAT_CURRENCY_PHP,
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $event->sheet->freezePane('A5');
                $event->sheet->getStyle('A4:J4')->getAlignment()->setHorizontal('center');
            },
        ];
    }

    public function title(): string
    {
        return 'Sales';
    }
}

class ItemsSheet implements FromArray, ShouldAutoSize, WithTitle, WithStyles, WithColumnFormatting
{
    public function __construct(protected Collection $sales) {}

    public function array(): array
    {
        $rows = [['Sale #', 'Product', 'Variant', 'Quantity', 'Unit Price', 'Line Total']];

        foreach ($this->sales as $sale) {
            foreach ($sale->items as $item) {
                $product = $item->productVariant?->product?->name ?? 'Item';
                $variant = $item->productVariant?->variant_name;
                $qty = $item->qty;
                $unit = $item->unit_price;
                $rows[] = [
                    $sale->sale_number,
                    $product,
                    $variant,
                    $qty,
                    $unit,
                    $qty * $unit,
                ];
            }
        }

        return $rows;
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->getStyle('A1:F1')->applyFromArray([
            'font' => ['bold' => true],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E2E8F0']],
            'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN]],
        ]);

        return [];
    }

    public function columnFormats(): array
    {
        return [
            'E' => NumberFormat::FORMAT_CURRENCY_PHP,
            'F' => NumberFormat::FORMAT_CURRENCY_PHP,
        ];
    }

    public function title(): string
    {
        return 'Items';
    }
}
