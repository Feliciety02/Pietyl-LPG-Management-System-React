<?php

namespace App\Services\POS;

use App\Models\Sale;
use App\Models\User;
use App\Services\Accounting\CostingService;
use App\Services\Accounting\LedgerService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AccountingService
{
    public function __construct(
        private LedgerService $ledgerService,
        private CostingService $costingService
    ) {}

    public function postSaleEntries(Sale $sale, array $lines, array $totals, string $paymentMethod, User $user): void
    {
        $salesLines = $this->prepareSalesLines($totals, $paymentMethod);
        $cogsLines = $this->prepareCOGSLines($sale, $lines);

        $this->ledgerService->postEntry([
            'entry_date' => Carbon::now()->toDateString(),
            'reference_type' => 'sale',
            'reference_id' => $sale->id,
            'created_by_user_id' => $user->id,
            'memo' => "Sale {$sale->sale_number}",
            'lines' => array_merge($salesLines, $cogsLines),
        ]);

        Log::info('AccountingService: ledger entries posted', [
            'sale_id' => $sale->id,
            'sales_lines_count' => count($salesLines),
            'cogs_lines_count' => count($cogsLines),
        ]);
    }

    private function prepareSalesLines(array $totals, string $paymentMethod): array
    {
        $lines = [];
        $debitAccount = $paymentMethod === 'cash' ? '2010' : '1020';
        $grossAmount = $totals['gross_amount'];
        $vatAmount = $totals['vat_amount'];
        $netAmount = $totals['net_amount'];

        // Debit: Cash or Bank
        $lines[] = [
            'account_code' => $debitAccount,
            'debit' => $grossAmount,
            'credit' => 0,
            'description' => $paymentMethod === 'cash'
                ? 'Cash sales recorded as turnover receivable'
                : 'Non-cash sales received in bank',
        ];

        // Credit: Sales Revenue
        $lines[] = [
            'account_code' => '4010',
            'debit' => 0,
            'credit' => $vatAmount > 0 ? $netAmount : $grossAmount,
            'description' => $vatAmount > 0
                ? 'Recognize sales revenue (net)'
                : 'Recognize sales revenue',
        ];

        // Credit: VAT Payable (if applicable)
        if ($vatAmount > 0) {
            $lines[] = [
                'account_code' => '2030',
                'debit' => 0,
                'credit' => $vatAmount,
                'description' => 'VAT payable',
            ];
        }

        return $lines;
    }

    private function prepareCOGSLines(Sale $sale, array $lines): array
    {
        $cogsTotal = 0.0;

        foreach ($lines as $i => $line) {
            $avgCost = $this->costingService->getWeightedAverageCost(
                (int) $line['product_id'], 
                Carbon::now()
            );

            Log::info('AccountingService: avg cost computed', [
                'sale_id' => $sale->id,
                'line_index' => $i,
                'product_id' => $line['product_id'],
                'avg_cost' => $avgCost,
            ]);

            $cogsTotal += ((float) $line['qty']) * ((float) $avgCost);
        }

        if ($cogsTotal <= 0) {
            return [];
        }

        return [
            [
                'account_code' => '5000',
                'debit' => $cogsTotal,
                'credit' => 0,
                'description' => 'Record cost of goods sold',
            ],
            [
                'account_code' => '1200',
                'debit' => 0,
                'credit' => $cogsTotal,
                'description' => 'Reduce inventory',
            ],
        ];
    }
}