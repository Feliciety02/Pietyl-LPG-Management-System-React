<?php

namespace App\Services\Accounting;

use App\Models\ChartOfAccount;
use App\Models\LedgerEntry;
use App\Models\LedgerLine;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LedgerService
{
    protected array $defaultAccounts = [
        '1010' => ['name' => 'Cash on Hand', 'account_type' => 'asset'],
        '1020' => ['name' => 'Cash in Bank', 'account_type' => 'asset'],
        '1200' => ['name' => 'Inventory', 'account_type' => 'asset'],
        '2010' => ['name' => 'Turnover Receivable', 'account_type' => 'asset'],
        '2030' => ['name' => 'VAT Payable', 'account_type' => 'liability'],
        '4010' => ['name' => 'Sales Revenue', 'account_type' => 'revenue'],
        '5000' => ['name' => 'Cost of Goods Sold', 'account_type' => 'expense'],
    ];

    public function postEntry(array $payload): LedgerEntry
    {
        $entryDate = $payload['entry_date'] ?? Carbon::now()->toDateString();
        $referenceType = $payload['reference_type'] ?? null;
        $referenceId = $payload['reference_id'] ?? null;
        $createdByUserId = $payload['created_by_user_id'];
        $memo = $payload['memo'] ?? null;
        $lines = $payload['lines'] ?? [];

        if ($referenceType && $referenceId) {
            $existing = LedgerEntry::where('reference_type', $referenceType)
                ->where('reference_id', $referenceId)
                ->first();
            if ($existing) {
                return $existing;
            }
        }

        $debits = 0;
        $credits = 0;
        foreach ($lines as $line) {
            $debits += (float) ($line['debit'] ?? 0);
            $credits += (float) ($line['credit'] ?? 0);
        }

        if (round($debits, 2) !== round($credits, 2)) {
            throw new \RuntimeException('Ledger entry not balanced.');
        }

        return DB::transaction(function () use ($entryDate, $referenceType, $referenceId, $createdByUserId, $memo, $lines) {
            $entry = LedgerEntry::create([
                'entry_date' => $entryDate,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'created_by_user_id' => $createdByUserId,
                'memo' => $memo,
            ]);

            foreach ($lines as $line) {
                $accountId = $line['account_id'] ?? null;
                if (!$accountId && !empty($line['account_code'])) {
                    $accountId = $this->getAccountIdByCode($line['account_code']);
                }

                LedgerLine::create([
                    'ledger_entry_id' => $entry->id,
                    'account_id' => $accountId,
                    'description' => $line['description'] ?? null,
                    'debit' => $line['debit'] ?? 0,
                    'credit' => $line['credit'] ?? 0,
                ]);
            }

            return $entry;
        });
    }

    public function getAccountIdByCode(string $code): int
    {
        $account = ChartOfAccount::where('code', $code)->first();
        if (!$account) {
            $account = ChartOfAccount::create([
                'code' => $code,
                'name' => $this->defaultAccounts[$code]['name'] ?? "Account {$code}",
                'account_type' => $this->defaultAccounts[$code]['account_type'] ?? 'asset',
            ]);
        }
        return $account->id;
    }
}
