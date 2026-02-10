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
        protected array $payload,
        protected array $transactions
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
            if (!empty($this->transactions)) {
                $rows[] = [];
                $rows[] = ['Transactions'];
                $rows[] = [
                    'Sale #',
                    'Date/Time',
                    'Customer',
                    'Cashier',
                    'Items',
                    'Qty',
                    'Cash',
                    'Non Cash',
                    'Net',
                    'VAT',
                    'Gross',
                ];
                foreach ($this->transactions as $row) {
                    $rows[] = [
                        $row['reference'] ?? '',
                        $row['sale_datetime'] ?? '',
                        $row['customer'] ?? '',
                        $row['cashier'] ?? '',
                        $row['items_count'] ?? 0,
                        $row['items_qty'] ?? 0,
                        $row['cash_amount'] ?? 0,
                        $row['non_cash_amount'] ?? 0,
                        $row['net_amount'] ?? 0,
                        $row['vat_amount'] ?? 0,
                        $row['gross_amount'] ?? 0,
                    ];
                }
            }
            return $rows;
        }

        if ($this->type === 'remittances') {
            $rows[] = ['Total Remitted', (float) ($this->payload['total_remitted'] ?? 0)];
            $rows[] = ['Variance Total', (float) ($this->payload['variance_total'] ?? 0)];
            if (!empty($this->transactions)) {
                $rows[] = [];
                $rows[] = ['Transactions'];
                $rows[] = [
                    'Business Date',
                    'Cashier',
                    'Expected Total',
                    'Expected Cash',
                    'Expected Non Cash',
                    'Remitted',
                    'Variance',
                    'Status',
                    'Recorded At',
                    'Accountant',
                ];
                foreach ($this->transactions as $row) {
                    $rows[] = [
                        $row['business_date'] ?? '',
                        $row['cashier'] ?? '',
                        $row['expected_amount'] ?? 0,
                        $row['expected_cash'] ?? 0,
                        $row['expected_noncash_total'] ?? 0,
                        $row['remitted_amount'] ?? 0,
                        $row['variance_amount'] ?? 0,
                        $row['status'] ?? '',
                        $row['recorded_at'] ?? '',
                        $row['accountant'] ?? '',
                    ];
                }
            }
            return $rows;
        }

        $rows[] = ['Variance Total', (float) ($this->payload['variance_total'] ?? 0)];
        if (!empty($this->transactions)) {
            $rows[] = [];
            $rows[] = ['Transactions'];
            $rows[] = [
                'Business Date',
                'Cashier',
                'Expected Total',
                'Expected Cash',
                'Expected Non Cash',
                'Remitted',
                'Variance',
                'Status',
                'Recorded At',
                'Accountant',
            ];
            foreach ($this->transactions as $row) {
                $rows[] = [
                    $row['business_date'] ?? '',
                    $row['cashier'] ?? '',
                    $row['expected_amount'] ?? 0,
                    $row['expected_cash'] ?? 0,
                    $row['expected_noncash_total'] ?? 0,
                    $row['remitted_amount'] ?? 0,
                    $row['variance_amount'] ?? 0,
                    $row['status'] ?? '',
                    $row['recorded_at'] ?? '',
                    $row['accountant'] ?? '',
                ];
            }
        }
        return $rows;
    }

    public function title(): string
    {
        return 'Report';
    }
}
