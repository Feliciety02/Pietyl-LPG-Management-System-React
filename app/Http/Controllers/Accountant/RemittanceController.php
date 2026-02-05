<?php

namespace App\Http\Controllers\Accountant;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DailyClose;
use App\Models\Remittance;
use App\Services\Accounting\LedgerService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RemittanceController extends Controller
{
    private ?Collection $methodsCache = null;

    public function index(Request $request)
    {
        $filters = [
            'q' => $request->input('q', ''),
            'status' => $request->input('status', 'all'),
            'date' => $request->input('date', ''),
            'tab' => $request->input('tab', 'cash'),
            'per' => (int) $request->input('per', 10),
            'page' => (int) $request->input('page', 1),
        ];

        $fromDate = $filters['date'] ?: now()->subDays(30)->toDateString();
        $toDate = $filters['date'] ?: now()->toDateString();

        $methods = $this->getPaymentMethods();
        $expectedRows = $this->loadExpectedRows($fromDate, $toDate);

        $remittances = Remittance::whereBetween('business_date', [$fromDate, $toDate])
            ->with('noncashVerifier')
            ->get()
            ->keyBy(function (Remittance $remittance) {
                return $remittance->business_date->toDateString() . '::' . $remittance->cashier_user_id;
            });

        $rows = $expectedRows->map(function ($item) use ($remittances) {
            $key = $item['business_date'] . '::' . $item['cashier_user_id'];
            $record = $remittances->get($key);

            $cashVariance = $record?->cash_variance;
            if ($cashVariance === null && $record?->remitted_cash_amount !== null) {
                $cashVariance = round($record->remitted_cash_amount - $item['expected_cash'], 2);
            }

            return [
                'id' => $record?->id,
                'business_date' => $item['business_date'],
                'cashier_user_id' => $item['cashier_user_id'],
                'cashier_name' => $item['cashier_name'],
                'expected_cash' => $item['expected_cash'],
                'expected_noncash_total' => $item['expected_noncash_total'],
                'expected_by_method' => $item['expected_by_method'],
                'remitted_cash_amount' => $record?->remitted_cash_amount,
                'cash_variance' => is_null($cashVariance) ? null : (float) round($cashVariance, 2),
                'cash_status' => $record?->status ?? 'pending',
                'note' => $record?->note,
                'recorded_at' => $record?->recorded_at?->format('Y-m-d H:i') ?? '-',
                'noncash_verified_at' => $record?->noncash_verified_at?->format('Y-m-d H:i'),
                'noncash_verified_by' => $record?->noncashVerifier?->name,
                'noncash_verification' => $record?->noncash_verification ?? [],
                'noncash_status' => $record?->noncash_verified_at ? 'verified' : 'unverified',
            ];
        });

        if (!empty($filters['q'])) {
            $q = mb_strtolower($filters['q']);
            $rows = $rows->filter(fn ($row) => str_contains(mb_strtolower($row['cashier_name'] ?? ''), $q));
        }

        if ($filters['status'] !== 'all') {
            $rows = $rows->filter(fn ($row) => $row['cash_status'] === $filters['status']);
        }

        $per = max(1, $filters['per']);
        $page = max(1, $filters['page']);
        $total = $rows->count();
        $items = $rows->slice(($page - 1) * $per, $per)->values();

        $paginator = new LengthAwarePaginator(
            $items,
            $total,
            $per,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

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
            'methods' => $methods->map(fn ($method) => [
                'method_key' => $method->method_key,
                'name' => $method->name,
                'is_cashless' => (bool) $method->is_cashless,
            ]),
        ]);
    }

    public function recordCash(Request $request, LedgerService $ledger)
    {
        $user = $request->user();
        if (!$user || !$user->can('accountant.remittances.verify')) {
            abort(403);
        }

        $validated = $request->validate([
            'business_date' => 'required|date',
            'cashier_user_id' => 'required|exists:users,id',
            'cash_counted' => 'required|numeric|min:0',
            'note' => 'nullable|string',
        ]);

        if (DailyClose::where('business_date', $validated['business_date'])->exists()) {
            return back()->with('error', 'This business date is already finalized.');
        }

        $expected = $this->expectedForRow($validated['business_date'], $validated['cashier_user_id']);
        $remitted = round((float) $validated['cash_counted'], 2);
        $variance = round($remitted - $expected['expected_cash'], 2);
        $note = Str::of($validated['note'] ?? '')->trim();

        if ($variance !== 0.0 && $note->length() < 3) {
            return back()->with('error', 'Provide a short note when cash variance is not zero.');
        }

        $status = $variance === 0.0 ? 'verified' : 'flagged';

        $existing = Remittance::where('business_date', $validated['business_date'])
            ->where('cashier_user_id', $validated['cashier_user_id'])
            ->first();
        $previous = (float) ($existing?->remitted_cash_amount ?? 0);

        $remittance = Remittance::updateOrCreate(
            [
                'business_date' => $validated['business_date'],
                'cashier_user_id' => $validated['cashier_user_id'],
            ],
            [
                'accountant_user_id' => $user->id,
                'expected_amount' => $expected['expected_cash'],
                'expected_cash' => $expected['expected_cash'],
                'expected_noncash_total' => $expected['expected_noncash_total'],
                'expected_by_method' => $expected['expected_by_method'],
                'remitted_amount' => $remitted,
                'remitted_cash_amount' => $remitted,
                'variance_amount' => $variance,
                'cash_variance' => $variance,
                'status' => $status,
                'note' => $note->whenEmpty(null),
                'recorded_at' => now(),
            ]
        );

        $delta = $remitted - $previous;

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

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'remittance.cash.recorded',
            'entity_type' => Remittance::class,
            'entity_id' => $remittance->id,
            'message' => "Recorded cash turnover for {$validated['business_date']} (variance: " . number_format($variance, 2) . ")",
            'after_json' => [
                'cash_status' => $status,
                'business_date' => $validated['business_date'],
                'cashier_user_id' => $validated['cashier_user_id'],
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', 'Cash turnover recorded.');
    }

    public function verifyNonCash(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('accountant.remittances.verify')) {
            abort(403);
        }

        $validated = $request->validate([
            'business_date' => 'required|date',
            'cashier_user_id' => 'required|exists:users,id',
            'verification' => 'required|array|min:1',
            'verification.*.method_key' => 'required|string',
            'verification.*.confirmed' => 'required|boolean',
            'verification.*.proof_count' => 'nullable|numeric|min:0',
            'verification.*.note' => 'nullable|string',
        ]);

        if (DailyClose::where('business_date', $validated['business_date'])->exists()) {
            return back()->with('error', 'This business date is already finalized.');
        }

        $expected = $this->expectedForRow($validated['business_date'], $validated['cashier_user_id']);
        $nonCashEntries = collect($validated['verification']);

        $allConfirmed = $nonCashEntries->every(fn ($item) => (bool) $item['confirmed']);
        $flaggingIssue = $nonCashEntries->filter(fn ($item) => !$item['confirmed'])->every(function ($item) {
            return Str::of($item['note'] ?? '')->trim()->length() >= 3;
        });

        if (!$allConfirmed && !$flaggingIssue) {
            return back()->with('error', 'Add a short note for any non cash method that is not confirmed.');
        }

        $verificationPayload = $nonCashEntries->map(function ($item) use ($expected) {
            $expectedAmount = $expected['expected_by_method'][$item['method_key']] ?? 0;
            return [
                'method_key' => $item['method_key'],
                'expected_amount' => (float) $expectedAmount,
                'proof_count' => isset($item['proof_count']) ? (int) $item['proof_count'] : 0,
                'confirmed' => (bool) $item['confirmed'],
                'confirmed_at' => $item['confirmed'] ? now()->toDateTimeString() : null,
                'note' => Str::of($item['note'] ?? '')->trim()->whenEmpty(null),
            ];
        })->toArray();

        $status = $allConfirmed ? 'verified' : 'flagged';

        $existing = Remittance::where('business_date', $validated['business_date'])
            ->where('cashier_user_id', $validated['cashier_user_id'])
            ->first();

        $remittance = Remittance::updateOrCreate(
            [
                'business_date' => $validated['business_date'],
                'cashier_user_id' => $validated['cashier_user_id'],
            ],
            [
                'accountant_user_id' => $user->id,
                'expected_cash' => $expected['expected_cash'],
                'expected_noncash_total' => $expected['expected_noncash_total'],
                'expected_by_method' => $expected['expected_by_method'],
                'noncash_verified_at' => now(),
                'noncash_verified_by_user_id' => $user->id,
                'noncash_verification' => $verificationPayload,
                'status' => $existing?->status ?? 'pending',
            ]
        );

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'remittance.noncash.verified',
            'entity_type' => Remittance::class,
            'entity_id' => $remittance->id,
            'message' => "Non cash verification for {$validated['business_date']} marked as {$status}",
            'after_json' => [
                'noncash_status' => $status,
                'verification' => $verificationPayload,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', 'Non cash verification saved.');
    }

    private function getPaymentMethods(): Collection
    {
        if ($this->methodsCache) {
            return $this->methodsCache;
        }

        return $this->methodsCache = DB::table('payment_methods')
            ->select('method_key', 'name', 'is_cashless')
            ->orderBy('is_cashless')
            ->orderBy('name')
            ->get();
    }

    private function loadExpectedRows(string $fromDate, string $toDate): Collection
    {
        $methods = $this->getPaymentMethods();

        $totals = DB::table('payments as p')
            ->join('payment_methods as pm', 'pm.id', '=', 'p.payment_method_id')
            ->join('sales as s', 's.id', '=', 'p.sale_id')
            ->join('users as u', 'u.id', '=', 's.cashier_user_id')
            ->whereDate('s.sale_datetime', '>=', $fromDate)
            ->whereDate('s.sale_datetime', '<=', $toDate)
            ->where('s.status', 'paid')
            ->selectRaw(
                'DATE(s.sale_datetime) as business_date, s.cashier_user_id, u.name as cashier_name, pm.method_key, pm.is_cashless, SUM(p.amount) as amount'
            )
            ->groupBy('business_date', 's.cashier_user_id', 'u.name', 'pm.method_key', 'pm.is_cashless')
            ->orderByDesc('business_date')
            ->get()
            ->groupBy(fn ($row) => "{$row->business_date}::{$row->cashier_user_id}");

        $rows = collect();
        foreach ($totals as $key => $items) {
            [$businessDate, $cashierId] = explode('::', $key);
            $expectedByMethod = [];
            $expectedCash = 0;
            $expectedNonCashTotal = 0;
            foreach ($items as $item) {
                $amount = (float) $item->amount;
                $expectedByMethod[$item->method_key] = $amount;
                if (Str::lower($item->method_key) === "cash") {
                    $expectedCash += $amount;
                } else {
                    $expectedNonCashTotal += $amount;
                }
            }

            foreach ($methods as $method) {
                if (!array_key_exists($method->method_key, $expectedByMethod)) {
                    $expectedByMethod[$method->method_key] = 0.0;
                }
            }

            $rows->push([
                'business_date' => $businessDate,
                'cashier_user_id' => (int) $cashierId,
                'cashier_name' => $items->first()->cashier_name,
                'expected_cash' => (float) $expectedCash,
                'expected_noncash_total' => (float) $expectedNonCashTotal,
                'expected_by_method' => $expectedByMethod,
            ]);
        }

        return $rows;
    }

    private function expectedForRow(string $businessDate, int $cashierId): array
    {
        $methods = $this->getPaymentMethods();

        $totals = DB::table('payments as p')
            ->join('payment_methods as pm', 'pm.id', '=', 'p.payment_method_id')
            ->join('sales as s', 's.id', '=', 'p.sale_id')
            ->whereDate('s.sale_datetime', $businessDate)
            ->where('s.cashier_user_id', $cashierId)
            ->where('s.status', 'paid')
            ->selectRaw('pm.method_key, pm.is_cashless, SUM(p.amount) as amount')
            ->groupBy('pm.method_key', 'pm.is_cashless')
            ->get();

        $expectedByMethod = [];
        $expectedCash = 0;
        $expectedNonCash = 0;

        foreach ($totals as $payment) {
            $amount = (float) $payment->amount;
            $expectedByMethod[$payment->method_key] = $amount;
            if (Str::lower($payment->method_key) === "cash") {
                $expectedCash += $amount;
            } else {
                $expectedNonCash += $amount;
            }
        }

        foreach ($methods as $method) {
            if (!array_key_exists($method->method_key, $expectedByMethod)) {
                $expectedByMethod[$method->method_key] = 0.0;
            }
        }

        return [
            'expected_cash' => (float) $expectedCash,
            'expected_noncash_total' => (float) $expectedNonCash,
            'expected_by_method' => $expectedByMethod,
        ];
    }
}
