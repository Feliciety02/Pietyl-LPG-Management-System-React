<?php

namespace App\Http\Controllers\Accountant;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DailyClose;
use App\Models\Remittance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DailySummaryController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->input('date', now()->toDateString());

        $salesTotals = DB::table('sales as s')
            ->whereDate('s.sale_datetime', $date)
            ->where('s.status', 'paid')
            ->selectRaw('COUNT(*) as transactions_count, SUM(s.grand_total) as total')
            ->first();

        $cashTotals = DB::table('payments as p')
            ->join('payment_methods as pm', 'pm.id', '=', 'p.payment_method_id')
            ->join('sales as s', 's.id', '=', 'p.sale_id')
            ->whereDate('s.sale_datetime', $date)
            ->where('s.status', 'paid')
            ->selectRaw('SUM(CASE WHEN pm.method_key = "cash" THEN p.amount ELSE 0 END) as cash_total, SUM(CASE WHEN pm.method_key <> "cash" THEN p.amount ELSE 0 END) as non_cash_total')
            ->first();

        $remittanceTotals = Remittance::where('business_date', $date)
            ->selectRaw('SUM(expected_amount) as expected_cash, SUM(COALESCE(remitted_amount, 0)) as remitted_cash, SUM(COALESCE(variance_amount, 0)) as variance_cash')
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
        $cashCountedTotal = (float) ($remittanceTotals->remitted_cash ?? 0);
        $varianceTotal = $cashCountedTotal - $cashExpectedTotal;

        $close = DailyClose::with('finalizedBy')->where('business_date', $date)->first();

        $summary = [
            'date' => $date,
            'sales_total' => (float) ($salesTotals->total ?? 0),
            'sales_count' => (int) ($salesTotals->transactions_count ?? 0),
            'cash_expected' => $cashExpectedTotal,
            'non_cash_total' => $nonCashTotal,
            'cash_counted' => $cashCountedTotal,
            'variance' => round($varianceTotal, 2),
            'status' => $close ? 'finalized' : 'open',
            'finalized_at' => $close?->finalized_at?->format('Y-m-d H:i'),
            'finalized_by' => $close?->finalizedBy?->name,
        ];

        return Inertia::render('AccountantPage/DailySummary', [
            'summary' => $summary,
            'cashier_turnover' => $cashierTurnover,
            'filters' => ['date' => $date],
        ]);
    }

    public function finalize(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('accountant.daily.view')) {
            abort(403);
        }

        $validated = $request->validate([
            'date' => 'required|date',
        ]);

        $date = $validated['date'];

        if (DailyClose::where('business_date', $date)->exists()) {
            return back()->with('error', 'This business date is already finalized.');
        }

        $cashTotals = Remittance::where('business_date', $date)
            ->selectRaw('SUM(COALESCE(expected_amount, 0)) as expected_cash, SUM(COALESCE(remitted_amount, 0)) as remitted_cash')
            ->first();

        $cashExpected = (float) ($cashTotals->expected_cash ?? 0);
        $cashCounted = (float) ($cashTotals->remitted_cash ?? 0);
        $variance = round($cashCounted - $cashExpected, 2);

        if ($variance !== 0.0) {
            return back()->with('error', 'Cannot finalize while variance is not zero.');
        }

        $close = DailyClose::create([
            'business_date' => $date,
            'finalized_by_user_id' => $user->id,
            'finalized_at' => now(),
        ]);

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'daily_summary.finalize',
            'entity_type' => DailyClose::class,
            'entity_id' => $close->id,
            'message' => "Finalized daily summary for {$date}",
            'after_json' => [
                'status' => 'finalized',
                'business_date' => $date,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return to_route('dash.accountant.daily', ['date' => $date])->with('success', 'Daily summary finalized.');
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
