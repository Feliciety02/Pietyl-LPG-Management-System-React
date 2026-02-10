<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InventoryBalanceSheet implements FromArray, ShouldAutoSize, WithColumnFormatting, WithEvents, WithStyles, WithTitle
{
    public function __construct(
        protected Collection $balances,
        protected string $locationName,
        protected string $generatedDate
    ) {}

    public function array(): array
    {
        $rows = [];

        // Header
        $rows[] = ['Inventory Balance Report'];
        $rows[] = ['Location: ' . $this->locationName];
        $rows[] = ['Generated: ' . $this->generatedDate];
        $rows[] = [];

        // Column headers
        $rows[] = [
            'Product Name',
            'Variant',
            'SKU',
            'Filled Units',
            'Reorder Level',
            'Status',
            'Last Updated',
        ];

        // Data rows
        foreach ($this->balances as $balance) {
            $total = $balance['qty_filled'];
            $status = $total <= $balance['reorder_level'] ? 'LOW STOCK' : 'OK';

            $rows[] = [
                $balance['product_name'],
                $balance['variant_name'],
                $balance['sku'],
                (int) $balance['qty_filled'],
                (int) $balance['reorder_level'],
                $status,
                $balance['updated_at'],
            ];
        }

        // Summary
        $rows[] = [];
        $rows[] = ['Summary'];
        $rows[] = ['Total Items', count($this->balances)];
        $rows[] = ['Low Stock Items', $this->balances->filter(fn ($b) => $b['qty_filled'] <= $b['reorder_level'])->count()];

        return $rows;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14]],
            2 => ['font' => ['bold' => true, 'size' => 11]],
            3 => ['font' => ['bold' => true, 'size' => 11]],
            5 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '366092']],
                'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN]],
            ],
        ];
    }

    public function columnFormats(): array
    {
        return [
            'D' => NumberFormat::FORMAT_NUMBER,
            'E' => NumberFormat::FORMAT_NUMBER,
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $event->sheet->getStyle('A5:G5')->getFont()->setBold(true);
            },
        ];
    }

    public function title(): string
    {
        return 'Inventory Balance';
    }
}
