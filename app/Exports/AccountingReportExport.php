<?php

namespace App\Exports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;

class AccountingReportExport implements FromArray, ShouldAutoSize, WithTitle
{
    public function __construct(
        protected string $type,
        protected Carbon $from,
        protected Carbon $to,
        protected array $payload
    ) {}

    public function array(): array
    {
        $rows = [
            ['Report Type', strtoupper($this->type)],
            ['From', $this->from->toDateString()],
            ['To', $this->to->toDateString()],
            [],
        ];

        if ($this->type === 'sales') {
            $rows[] = ['Total Sales', (float) ($this->payload['total_sales'] ?? 0)];
            $rows[] = ['Total Net Sales', (float) ($this->payload['total_net_sales'] ?? 0)];
            $rows[] = ['Total VAT', (float) ($this->payload['total_vat'] ?? 0)];
            $rows[] = ['Total Cash', (float) ($this->payload['total_cash'] ?? 0)];
            $rows[] = ['Total Non Cash', (float) ($this->payload['total_non_cash'] ?? 0)];
            $rows[] = ['COGS', (float) ($this->payload['cogs'] ?? 0)];
            $rows[] = ['Gross Profit', (float) ($this->payload['gross_profit'] ?? 0)];
            $rows[] = ['Inventory Valuation', (float) ($this->payload['inventory_valuation'] ?? 0)];
            return $rows;
        }

        if ($this->type === 'remittances') {
            $rows[] = ['Total Remitted', (float) ($this->payload['total_remitted'] ?? 0)];
            $rows[] = ['Variance Total', (float) ($this->payload['variance_total'] ?? 0)];
            return $rows;
        }

        $rows[] = ['Variance Total', (float) ($this->payload['variance_total'] ?? 0)];
        return $rows;
    }

    public function title(): string
    {
        return 'Report';
    }
}
