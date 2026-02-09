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

class InventoryMovementSheet implements FromArray, ShouldAutoSize, WithColumnFormatting, WithEvents, WithStyles, WithTitle
{
    public function __construct(
        protected Collection $movements,
        protected string $dateFrom,
        protected string $dateTo
    ) {}

    public function array(): array
    {
        $rows = [];

        // Header
        $rows[] = ['Stock Movement Report'];
        $rows[] = ['Period: ' . $this->dateFrom . ' to ' . $this->dateTo];
        $rows[] = [];

        // Column headers
        $rows[] = [
            'Date',
            'Time',
            'Product',
            'Variant',
            'Movement Type',
            'Quantity In',
            'Quantity Out',
            'Location',
            'Reference',
            'Actor',
            'Notes',
        ];

        // Data rows
        foreach ($this->movements as $movement) {
            $datetime = \Carbon\Carbon::parse($movement['created_at']);

            $rows[] = [
                $datetime->format('Y-m-d'),
                $datetime->format('H:i:s'),
                $movement['product_name'] ?? 'N/A',
                $movement['variant_name'] ?? 'N/A',
                ucwords(str_replace('_', ' ', $movement['source_type'] ?? 'Unknown')),
                (float) ($movement['qty_in'] ?? 0),
                (float) ($movement['qty_out'] ?? 0),
                $movement['location_name'] ?? 'N/A',
                $movement['reference_id'] ?? 'N/A',
                $movement['actor_name'] ?? 'System',
                $movement['remarks'] ?? '',
            ];
        }

        // Summary
        $rows[] = [];
        $rows[] = ['Summary'];
        $rows[] = ['Total Movements', count($this->movements)];

        $totalIn = $this->movements->sum('qty_in');
        $totalOut = $this->movements->sum('qty_out');

        $rows[] = ['Total Quantity In', (float) $totalIn];
        $rows[] = ['Total Quantity Out', (float) $totalOut];
        $rows[] = ['Net Movement', (float) ($totalIn - $totalOut)];

        return $rows;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14]],
            2 => ['font' => ['bold' => true, 'size' => 11]],
            4 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '366092']],
                'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN]],
            ],
        ];
    }

    public function columnFormats(): array
    {
        return [
            'E' => NumberFormat::FORMAT_NUMBER,
            'F' => NumberFormat::FORMAT_NUMBER,
            'G' => NumberFormat::FORMAT_NUMBER,
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $event->sheet->getStyle('A4:K4')->getFont()->setBold(true);
            },
        ];
    }

    public function title(): string
    {
        return 'Stock Movements';
    }
}
