<?php

namespace App\Http\Controllers\Accountant;

use App\Http\Controllers\Controller;
use App\Models\DailyClose;
use App\Models\Remittance;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\Accounting\LedgerService;

class RemittanceController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'q' => $request->input('q', ''),
            'status' => $request->input('status', 'all'),
            'per' => (int) $request->input('per', 10),
            'page' => (int) $request->input('page', 1),
        ];

        $fromDate = now()->subDays(30)->toDateString();
        $toDate = now()->toDateString();

        $expectedRows = DB::table('payments as p')
            ->join('payment_methods as pm', 'pm.id', '=', 'p.payment_method_id')
            ->join('sales as s', 's.id', '=', 'p.sale_id')
            ->join('users as u', 'u.id', '=', 's.cashier_user_id')
            ->where('pm.method_key', 'cash')
            ->whereDate('s.sale_datetime', '>=', $fromDate)
            ->whereDate('s.sale_datetime', '<=', $toDate)
            ->selectRaw('DATE(s.sale_datetime) as business_date, s.cashier_user_id, u.name as cashier_name, SUM(p.amount) as expected_amount')
            ->groupBy('business_date', 's.cashier_user_id', 'u.name')
            ->orderByDesc('business_date')
            ->get();

        $remittances = Remittance::whereBetween('business_date', [$fromDate, $toDate])->get()
            ->keyBy(function ($r) {
                return $r->business_date->toDateString() . '::' . $r->cashier_user_id;
            });

        $rows = $expectedRows->map(function ($row) use ($remittances) {
            $key = $row->business_date . '::' . $row->cashier_user_id;
            $r = $remittances->get($key);

            return [
                'id' => $r?->id ?? null,
                'remitter_role' => 'cashier',
                'cashier_user_id' => $row->cashier_user_id,
                'cashier_name' => $row->cashier_name,
                'business_date' => $row->business_date,
                'expected_amount' => (float) $row->expected_amount,
                'remitted_amount' => $r?->remitted_amount,
                'variance_amount' => $r?->variance_amount,
                'status' => $r?->status ?? 'pending',
                'note' => $r?->note,
                'updated_at' => $r?->updated_at?->format('Y-m-d H:i') ?? '-',
            ];
        })->values();

        if (!empty($filters['q'])) {
            $q = mb_strtolower($filters['q']);
            $rows = $rows->filter(fn ($r) => str_contains(mb_strtolower($r['cashier_name'] ?? ''), $q))->values();
        }

        if ($filters['status'] !== 'all') {
            $rows = $rows->filter(fn ($r) => $r['status'] === $filters['status'])->values();
        }

        $total = $rows->count();
        $per = max(1, $filters['per']);
        $page = max(1, $filters['page']);
        $items = $rows->slice(($page - 1) * $per, $per)->values();

        $paginator = new LengthAwarePaginator($items, $total, $per, $page, [
            'path' => $request->url(),
            'query' => $request->query(),
        ]);

        return Inertia::render('AccountantPage/Remittances', [
            'remittances' => [
                'data' => $paginator->items(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'from' => $paginator->firstItem(),
                    'to' => $paginator->lastItem(),
                    'total' => $paginator->total(),
                ],
            ],
            'filters' => $filters,
        ]);
    }

    public function record(Request $request, LedgerService $ledger)
    {
        $user = $request->user();
        if (!$user || !$user->can('accountant.remittances.verify')) {
            abort(403);
        }

        $validated = $request->validate([
            'business_date' => 'required|date',
            'cashier_user_id' => 'required|exists:users,id',
            'remitted_amount' => 'required|numeric|min:0',
            'note' => 'nullable|string',
        ]);

        if (DailyClose::where('business_date', $validated['business_date'])->exists()) {
            return back()->with('error', 'This business date is already finalized.');
        }

        $expected = DB::table('payments as p')
            ->join('payment_methods as pm', 'pm.id', '=', 'p.payment_method_id')
            ->join('sales as s', 's.id', '=', 'p.sale_id')
            ->where('pm.method_key', 'cash')
            ->whereDate('s.sale_datetime', $validated['business_date'])
            ->where('s.cashier_user_id', $validated['cashier_user_id'])
            ->sum('p.amount');

        $remitted = (float) $validated['remitted_amount'];
        $variance = $remitted - (float) $expected;
        $status = $variance === 0.0 ? 'verified' : 'flagged';

        $existing = Remittance::where('business_date', $validated['business_date'])
            ->where('cashier_user_id', $validated['cashier_user_id'])
            ->first();
        $previousRemitted = (float) ($existing?->remitted_amount ?? 0);

        $remittance = Remittance::updateOrCreate(
            [
                'business_date' => $validated['business_date'],
                'cashier_user_id' => $validated['cashier_user_id'],
            ],
            [
                'accountant_user_id' => $user->id,
                'expected_amount' => (float) $expected,
                'remitted_amount' => $remitted,
                'variance_amount' => $variance,
                'status' => $status,
                'note' => $validated['note'] ?? null,
                'recorded_at' => now(),
            ]
        );

        $delta = $remitted - $previousRemitted;

        if ($delta !== 0.0) {
            $refType = $existing ? 'remittance_adjustment' : 'remittance';
            $deltaAbs = abs($delta);
            $isPositive = $delta > 0;
            $ledger->postEntry([
                'entry_date' => $validated['business_date'],
                'reference_type' => $refType,
                'reference_id' => $remittance->id,
                'created_by_user_id' => $user->id,
                'memo' => "Cashier remittance {$validated['business_date']}",
                'lines' => [
                    [
                        'account_code' => '1010',
                        'debit' => $isPositive ? $deltaAbs : 0,
                        'credit' => $isPositive ? 0 : $deltaAbs,
                        'description' => 'Cash received from cashier',
                    ],
                    [
                        'account_code' => '2010',
                        'debit' => $isPositive ? 0 : $deltaAbs,
                        'credit' => $isPositive ? $deltaAbs : 0,
                        'description' => 'Reduce turnover receivable',
                    ],
                ],
            ]);
        }

        return back()->with('success', 'Remittance recorded.');
    }
}
