<?php

namespace App\Http\Controllers\Accountant;

use App\Http\Controllers\Controller;
use App\Models\DailyClose;
use App\Models\Remittance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DailySummaryController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->input('date', now()->toDateString());

        $salesTotals = DB::table('sales')
            ->whereDate('sale_datetime', $date)
            ->selectRaw('COUNT(*) as transactions_count, SUM(grand_total) as total')
            ->first();

        $cashTotals = DB::table('payments as p')
            ->join('payment_methods as pm', 'pm.id', '=', 'p.payment_method_id')
            ->join('sales as s', 's.id', '=', 'p.sale_id')
            ->whereDate('s.sale_datetime', $date)
            ->selectRaw('SUM(CASE WHEN pm.method_key = "cash" THEN p.amount ELSE 0 END) as cash_total,
                        SUM(CASE WHEN pm.method_key <> "cash" THEN p.amount ELSE 0 END) as non_cash_total')
            ->first();

        $remittanceAgg = Remittance::where('business_date', $date)->selectRaw(
            'SUM(expected_amount) as expected_cash,
             SUM(remitted_amount) as remitted_cash,
             SUM(variance_amount) as variance_cash,
             SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_count,
             SUM(CASE WHEN status = "verified" THEN 1 ELSE 0 END) as verified_count,
             SUM(CASE WHEN status = "flagged" THEN 1 ELSE 0 END) as flagged_count'
        )->first();

        $close = DailyClose::where('business_date', $date)->first();

        $summary = [
            'business_date' => $date,
            'sales' => [
                'total' => (float) ($salesTotals->total ?? 0),
                'cash' => (float) ($cashTotals->cash_total ?? 0),
                'non_cash' => (float) ($cashTotals->non_cash_total ?? 0),
                'transactions_count' => (int) ($salesTotals->transactions_count ?? 0),
            ],
            'cashier_turnover' => [
                'expected_cash' => (float) ($remittanceAgg->expected_cash ?? $cashTotals->cash_total ?? 0),
                'remitted_cash' => (float) ($remittanceAgg->remitted_cash ?? 0),
                'variance_cash' => (float) ($remittanceAgg->variance_cash ?? 0),
                'pending_count' => (int) ($remittanceAgg->pending_count ?? 0),
                'verified_count' => (int) ($remittanceAgg->verified_count ?? 0),
                'flagged_count' => (int) ($remittanceAgg->flagged_count ?? 0),
            ],
            'status' => $close ? 'finalized' : 'open',
            'finalized_at' => $close?->finalized_at?->format('Y-m-d H:i'),
            'finalized_by' => $close?->finalizedBy?->name,
        ];

        return Inertia::render('AccountantPage/DailySummary', [
            'summary' => $summary,
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

        $variance = Remittance::where('business_date', $date)->sum('variance_amount');
        if (round((float) $variance, 2) !== 0.0) {
            return back()->with('error', 'Cannot finalize while variance is not zero.');
        }

        DailyClose::create([
            'business_date' => $date,
            'finalized_by_user_id' => $user->id,
            'finalized_at' => now(),
        ]);

        return back()->with('success', 'Daily summary finalized.');
    }
}
