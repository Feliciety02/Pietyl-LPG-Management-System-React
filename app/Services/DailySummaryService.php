<?php

namespace App\Services;

use App\Models\DailyClose;
use App\Models\Remittance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DailySummaryService
{
    public function getSummary(string $date): array
    {
        $salesTotals = DB::table('sales as s')
            ->whereDate('s.sale_datetime', $date)
            ->where('s.status', 'paid')
            ->selectRaw('COUNT(*) as transactions_count, SUM(s.grand_total) as total, SUM(s.net_amount) as net_total, SUM(s.vat_amount) as vat_total')
            ->first();

        $cashTotals = DB::table('payments as p')
            ->join('payment_methods as pm', 'pm.id', '=', 'p.payment_method_id')
            ->join('sales as s', 's.id', '=', 'p.sale_id')
            ->whereDate('s.sale_datetime', $date)
            ->where('s.status', 'paid')
            ->selectRaw('SUM(CASE WHEN pm.method_key = "cash" THEN p.amount ELSE 0 END) as cash_total, SUM(CASE WHEN pm.method_key <> "cash" THEN p.amount ELSE 0 END) as non_cash_total')
            ->first();

        $remittanceTotals = Remittance::where('business_date', $date)
            ->selectRaw('SUM(expected_amount) as expected_amount, SUM(COALESCE(remitted_amount, 0)) as remitted_amount, SUM(COALESCE(variance_amount, 0)) as variance_amount')
            ->first();

        $expectedSalesByCashier = DB::table('sales as s')
            ->join('users as u', 'u.id', '=', 's.cashier_user_id')
            ->whereDate('s.sale_datetime', $date)
            ->where('s.status', 'paid')
            ->selectRaw('s.cashier_user_id, u.name as cashier_name, SUM(s.grand_total) as expected_amount')
            ->groupBy('s.cashier_user_id', 'u.name')
            ->get();

        $remittances = Remittance::where('business_date', $date)
            ->with('cashier')
            ->get();

        $expectedMap = $expectedSalesByCashier->keyBy('cashier_user_id');
        $remittancesByCashier = $remittances->keyBy('cashier_user_id');
        $cashierIds = $expectedMap->keys()->merge($remittancesByCashier->keys())->filter()->unique();

        $cashierTurnover = $cashierIds->map(function ($cashierId) use ($expectedMap, $remittancesByCashier) {
            $expected = $expectedMap->get($cashierId);
            $remittance = $remittancesByCashier->get($cashierId);

            $cashExpected = (float) ($remittance?->expected_amount ?? $expected?->expected_amount ?? 0);
            $cashCounted = (float) ($remittance?->remitted_amount ?? 0);
            $variance = $cashCounted - $cashExpected;
            $recordedAt = $remittance?->recorded_at;
            $shift = $this->determineShift($recordedAt);

            return [
                'id' => $remittance?->id,
                'cashier_name' => $remittance?->cashier?->name ?? $expected?->cashier_name ?? 'Unknown',
                'shift' => $shift,
                'cash_expected' => $cashExpected,
                'cash_counted' => $cashCounted,
                'variance' => $variance,
                'status' => $remittance?->status ?? 'pending',
                'recorded_at' => $recordedAt?->format('Y-m-d H:i'),
            ];
        })->values();

        $cashExpectedTotal = (float) ($cashTotals->cash_total ?? 0);
        $nonCashTotal = (float) ($cashTotals->non_cash_total ?? 0);
        $cashCountedTotal = (float) ($remittanceTotals->remitted_amount ?? 0);
        $varianceTotal = $cashCountedTotal - $cashExpectedTotal;

        $close = DailyClose::with('finalizedBy')->where('business_date', $date)->first();

        $summary = [
            'date' => $date,
            'sales_total' => (float) ($salesTotals->total ?? 0),
            'net_total' => (float) ($salesTotals->net_total ?? 0),
            'vat_total' => (float) ($salesTotals->vat_total ?? 0),
            'sales_count' => (int) ($salesTotals->transactions_count ?? 0),
            'cash_expected' => $cashExpectedTotal,
            'non_cash_total' => $nonCashTotal,
            'cash_counted' => $cashCountedTotal,
            'variance' => round($varianceTotal, 2),
            'status' => $close ? 'finalized' : 'open',
            'finalized_at' => $close?->finalized_at?->format('Y-m-d H:i'),
            'finalized_by' => $close?->finalizedBy?->name,
        ];

        return [
            'summary' => $summary,
            'cashier_turnover' => $cashierTurnover,
        ];
    }

    private function determineShift(?Carbon $recordedAt): string
    {
        if (!$recordedAt) {
            return 'Unassigned';
        }

        $hour = (int) $recordedAt->format('H');

        if ($hour < 12) {
            return 'Morning';
        }

        if ($hour < 18) {
            return 'Afternoon';
        }

        return 'Night';
    }
}
