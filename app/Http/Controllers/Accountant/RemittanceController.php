<?php

namespace App\Http\Controllers\Accountant;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DailyClose;
use App\Models\Payment;
use App\Models\Remittance;
use App\Models\User;
use App\Services\Accounting\LedgerService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
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
            'per' => (int) $request->input('per', 10),
            'page' => (int) $request->input('page', 1),
        ];

        $fromDate = $filters['date'] ?: now()->subDays(30)->toDateString();
        $toDate = $filters['date'] ?: now()->toDateString();

        $methods = $this->getPaymentMethods();
        $baseQuery = $this->buildTurnoverBaseQuery($fromDate, $toDate);
        $this->applyTurnoverFilters($baseQuery, $filters);

        $rowsQuery = (clone $baseQuery)
            ->leftJoin('users as nv', 'nv.id', '=', 'r.noncash_verified_by_user_id')
            ->select(
                'expected.business_date',
                'expected.cashier_user_id',
                'expected.cashier_name',
                'expected.expected_cash',
                'expected.expected_noncash_total',
                'r.id as remittance_id',
                'r.remitted_cash_amount',
                'r.note',
                'r.recorded_at',
                'r.noncash_verified_at',
                'r.noncash_verification',
                'nv.name as noncash_verified_by'
            )
            ->selectRaw($this->cashVarianceSql() . ' as cash_variance')
            ->selectRaw($this->statusCaseSql() . ' as status')
            ->selectRaw('CASE WHEN dc.business_date IS NULL THEN 0 ELSE 1 END as finalized')
            ->selectRaw($this->noncashVerifiedTotalSql() . ' as noncash_verified_total')
            ->selectRaw($this->noncashVerifiedCountSql() . ' as noncash_verified_count')
            ->orderByDesc('expected.business_date')
            ->orderBy('expected.cashier_name');

        $paginator = $rowsQuery->paginate(max(1, $filters['per']))->withQueryString();
        $rawRows = collect($paginator->items());
        $expectedByMethod = $this->loadExpectedByMethodForRows($rawRows, $methods);

        $rows = $rawRows->map(function ($row) use ($expectedByMethod, $methods) {
            $key = $row->business_date . '::' . $row->cashier_user_id;
            $expectedForRow = $expectedByMethod[$key] ?? [];
            foreach ($methods as $method) {
                if (!array_key_exists($method->method_key, $expectedForRow)) {
                    $expectedForRow[$method->method_key] = 0.0;
                }
            }

            $verification = $row->noncash_verification ?? [];
            if (is_string($verification)) {
                $decoded = json_decode($verification, true);
                $verification = is_array($decoded) ? $decoded : [];
            }

            $verifiedTransactionIds = is_array($verification['transaction_ids'] ?? null)
                ? $verification['transaction_ids']
                : [];

            $noncashVerifiedAmount = $row->noncash_verified_total ?? ($verification['amount'] ?? 0);

            return [
                'id' => $row->remittance_id,
                'business_date' => $row->business_date,
                'cashier_user_id' => (int) $row->cashier_user_id,
                'cashier_name' => $row->cashier_name,
                'expected_cash' => (float) ($row->expected_cash ?? 0),
                'expected_cashless_total' => (float) ($row->expected_noncash_total ?? 0),
                'expected_noncash_total' => (float) ($row->expected_noncash_total ?? 0),
                'expected_by_method' => $expectedForRow,
                'remitted_cash_amount' => $row->remitted_cash_amount,
                'cash_counted' => $row->remitted_cash_amount,
                'cash_variance' => $row->cash_variance !== null ? (float) $row->cash_variance : null,
                'cash_status' => $row->status,
                'status' => $row->status,
                'finalized' => (bool) $row->finalized,
                'note' => $row->note,
                'recorded_at' => $row->recorded_at ? date('Y-m-d H:i', strtotime($row->recorded_at)) : '-',
                'noncash_verified_at' => $row->noncash_verified_at ? date('Y-m-d H:i', strtotime($row->noncash_verified_at)) : null,
                'noncash_verified_by' => $row->noncash_verified_by,
                'noncash_verification' => $verification,
                'noncash_status' => $row->noncash_verified_at ? 'verified' : 'unverified',
                'noncash_verified_total' => round((float) $noncashVerifiedAmount, 2),
                'noncash_verified_count' => (int) ($row->noncash_verified_count ?? count($verifiedTransactionIds)),
                'verified_transaction_ids' => $verifiedTransactionIds,
            ];
        })->values();

        $remittanceKpis = $this->buildTurnoverKpis($fromDate, $toDate, $filters);

        return Inertia::render('AccountantPage/Remittances', [
            'remittances' => [
                'data' => $rows,
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'from' => $paginator->firstItem(),
                    'to' => $paginator->lastItem(),
                    'total' => $paginator->total(),
                ],
            ],
            'filters' => $filters,
            'remittance_kpis' => $remittanceKpis,
            'methods' => $methods->map(fn ($method) => [
                'method_key' => $method->method_key,
                'name' => $method->name,
                'is_cashless' => (bool) $method->is_cashless,
            ]),
        ]);
    }

    public function review(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('accountant.remittances.view')) {
            abort(403);
        }

        $validated = $request->validate([
            'business_date' => 'required|date',
            'cashier_user_id' => 'required|exists:users,id',
            'return_url' => 'nullable|string',
        ]);

        $expected = $this->expectedForRow($validated['business_date'], $validated['cashier_user_id']);
        $remittance = Remittance::where('business_date', $validated['business_date'])
            ->where('cashier_user_id', $validated['cashier_user_id'])
            ->first();

        return Inertia::render('AccountantPage/TurnoverReview', [
            'row' => [
                'business_date' => $validated['business_date'],
                'cashier_user_id' => $validated['cashier_user_id'],
                'cashier_name' => User::find($validated['cashier_user_id'])?->name,
                'expected_cash' => $expected['expected_cash'],
                'remitted_cash_amount' => $remittance?->remitted_cash_amount,
                'note' => $remittance?->note,
                'expected_by_method' => $expected['expected_by_method'],
            ],
            'methods' => $this->getPaymentMethods()->map(fn ($method) => [
                'method_key' => $method->method_key,
                'method_name' => $method->name,
                'is_cashless' => (bool) $method->is_cashless,
            ]),
            'return_url' => $validated['return_url'] ?: '/dashboard/accountant/remittances',
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

        try {
            $this->persistCashTurnover(
                $request,
                $validated['business_date'],
                $validated['cashier_user_id'],
                round((float) $validated['cash_counted'], 2),
                $validated['note'] ?? null,
                $user,
                $ledger
            );
        } catch (\InvalidArgumentException $ex) {
            return back()->with('error', $ex->getMessage());
        }

        return back()->with('success', 'Cash turnover recorded.');
    }

    public function cashlessTransactions(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('accountant.remittances.view')) {
            abort(403);
        }

        $validated = $request->validate([
            'business_date' => 'required|date',
            'cashier_user_id' => 'required|exists:users,id',
        ]);

        $transactions = $this->cashlessTransactionsFor(
            $validated['business_date'],
            $validated['cashier_user_id']
        );

        return response()->json([
            'transactions' => $transactions,
        ]);
    }

    public function verifyCashlessTransactions(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('accountant.remittances.verify')) {
            abort(403);
        }

        $validated = $request->validate([
            'business_date' => 'required|date',
            'cashier_user_id' => 'required|exists:users,id',
            'verified_transaction_ids' => 'nullable|array', 
            'verified_transaction_ids.*' => 'nullable|integer|distinct',
        ]);

        if (DailyClose::where('business_date', $validated['business_date'])->exists()) {
            return response()->json([
                'message' => 'This business date is already finalized.',
            ], 422);
        }

        try {
            $remittance = $this->persistCashlessVerification(
                $request,
                $validated['business_date'],
                $validated['cashier_user_id'],
                $validated['verified_transaction_ids'] ?? [],
                $user
            );
        } catch (InvalidArgumentException $ex) {
            return response()->json(['message' => $ex->getMessage()], 422);
        }

        $verification = $remittance->noncash_verification ?? [];
        $verifiedIds = is_array($verification['transaction_ids'] ?? null)
            ? $verification['transaction_ids']
            : [];
        $verifiedAmount = round((float) ($verification['amount'] ?? 0), 2);

        return response()->json([
            'transactions' => $this->cashlessTransactionsFor(
                $validated['business_date'],
                $validated['cashier_user_id']
            ),
            'verified_count' => count($verifiedIds),
            'verified_amount' => $verifiedAmount,
            'message' => 'Cashless transactions confirmed.',
        ]);
    }

    public function dailyClose(Request $request, LedgerService $ledger)
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
            'verified_transaction_ids' => 'nullable|array',
            'verified_transaction_ids.*' => 'required_with:verified_transaction_ids|integer|distinct',
        ]);

        $existingClose = DailyClose::where('business_date', $validated['business_date'])->first();
        if ($existingClose) {
            return response()->json([
                'message' => 'This business date is already finalized.',
                'finalized_at' => $existingClose->finalized_at?->toDateTimeString(),
            ], 200);
        }

        try {
            $remittance = $this->persistCashTurnover(
                $request,
                $validated['business_date'],
                $validated['cashier_user_id'],
                round((float) $validated['cash_counted'], 2),
                $validated['note'] ?? null,
                $user,
                $ledger
            );

            $pendingIds = $this->pendingCashlessTransactionIds(
                $validated['business_date'],
                $validated['cashier_user_id']
            );
            $verifiedPayload = $validated['verified_transaction_ids'] ?? [];

            if (!empty($pendingIds)) {
                if (empty($verifiedPayload)) {
                    throw new InvalidArgumentException(
                        'Verify all pending cashless transactions before finalizing.'
                    );
                }

                $missing = array_diff($pendingIds, $verifiedPayload);
                if (!empty($missing)) {
                    throw new InvalidArgumentException(
                        'All pending cashless transactions must be verified before finalizing.'
                    );
                }

                $remittance = $this->persistCashlessVerification(
                    $request,
                    $validated['business_date'],
                    $validated['cashier_user_id'],
                    $verifiedPayload,
                    $user
                );
            }

            $remittance->status = $this->stageFromFlags(true, true, true);
            $remittance->save();

            $close = DailyClose::create([
                'business_date' => $validated['business_date'],
                'finalized_by_user_id' => $user->id,
                'finalized_at' => now(),
            ]);

            AuditLog::create([
                'actor_user_id' => $user->id,
                'action' => 'remittance.daily.finalized',
                'entity_type' => Remittance::class,
                'entity_id' => $remittance->id,
                'message' => "Daily close finalized for {$validated['business_date']}",
                'after_json' => [
                    'status' => 'finalized',
                    'business_date' => $validated['business_date'],
                    'cashier_user_id' => $validated['cashier_user_id'],
                    'cash_counted' => round((float) ($remittance->remitted_cash_amount ?? 0), 2),
                    'cashless_verified_amount' => round((float) ($remittance->noncash_verification['amount'] ?? 0), 2),
                    'total_amount' => round(
                        (float) ($remittance->remitted_cash_amount ?? 0) +
                        (float) ($remittance->noncash_verification['amount'] ?? 0),
                        2
                    ),
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'message' => 'Daily closure finalized.',
                'status' => 'finalized',
                'finalized_at' => $close->finalized_at?->toDateTimeString(),
            ]);
        } catch (InvalidArgumentException $ex) {
            return response()->json(['message' => $ex->getMessage()], 422);
        }
    }

    public function reopen(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('accountant.remittances.verify')) {
            abort(403);
        }

        $validated = $request->validate([
            'business_date' => 'required|date',
        ]);

        $close = DailyClose::where('business_date', $validated['business_date'])->first();
        if (!$close) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Business date is not finalized.'], 422);
            }

            return back()->with('error', 'Business date is not finalized.');
        }

        $close->delete();

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'remittance.daily.reopen',
            'entity_type' => DailyClose::class,
            'entity_id' => $close->id,
            'message' => "Reopened daily close for {$validated['business_date']}",
            'after_json' => [
                'status' => 'open',
                'business_date' => $validated['business_date'],
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        if ($request->wantsJson()) {
            return response()->json(['status' => 'open']);
        }

        return back()->with('success', 'Business date reopened.');
    }

    private function persistCashlessVerification(
        Request $request,
        string $businessDate,
        int $cashierId,
        array $transactionIds,
        User $user
    ): Remittance {
        $transactionIds = array_values(array_unique($transactionIds ?? []));
        $expected = $this->expectedForRow($businessDate, $cashierId);

        $remittance = Remittance::updateOrCreate(
            [
                'business_date' => $businessDate,
                'cashier_user_id' => $cashierId,
            ],
            [
                'accountant_user_id' => $user->id,
                'expected_cash' => $expected['expected_cash'],
                'expected_noncash_total' => $expected['expected_noncash_total'],
                'expected_by_method' => $expected['expected_by_method'],
            ]
        );

        if (empty($transactionIds)) {
            return $remittance->refresh();
        }

        $payments = $this->cashlessPaymentsQuery($businessDate, $cashierId)
            ->whereIn('payments.id', $transactionIds)
            ->get();

        if ($payments->count() !== count($transactionIds)) {
            throw new InvalidArgumentException(
                'Some transactions are no longer available. Refresh and try again.'
            );
        }

        $alreadyVerifiedIds = $payments
            ->filter(fn ($payment) => $payment->noncash_verified_at)
            ->pluck('id')
            ->all();

        if (!empty($alreadyVerifiedIds)) {
            throw new InvalidArgumentException('Some selected transactions have already been verified.');
        }

        foreach ($payments as $payment) {
            $payment->noncash_verified_at = now();
            $payment->noncash_verified_by_user_id = $user->id;
            $payment->noncash_verified_business_date = $businessDate;
            $payment->noncash_remittance_id = $remittance->id;
            $payment->save();
        }

        $existingVerifiedIds = is_array($remittance->noncash_verification['transaction_ids'] ?? null)
            ? $remittance->noncash_verification['transaction_ids']
            : [];
        $allVerifiedIds = array_values(array_unique(array_merge($existingVerifiedIds, $transactionIds)));

        $verifiedTotalAmount = 0.0;
        if (!empty($allVerifiedIds)) {
            $verifiedTotalAmount = $this->cashlessPaymentsQuery($businessDate, $cashierId)
                ->whereIn('payments.id', $allVerifiedIds)
                ->sum('amount');
        }

        $cashRecorded = (bool) $remittance->remitted_cash_amount;
        $stage = $this->stageFromFlags($cashRecorded, true, false);

        $remittance->forceFill([
            'noncash_verified_at' => now(),
            'noncash_verified_by_user_id' => $user->id,
            'noncash_verification' => [
                'transaction_ids' => $allVerifiedIds,
                'amount' => round($verifiedTotalAmount, 2),
            ],
            'status' => $stage,
        ])->save();

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'remittance.noncash_transactions.verified',
            'entity_type' => Remittance::class,
            'entity_id' => $remittance->id,
            'message' => "Verified " . count($transactionIds) . " cashless transactions for {$businessDate} totaling " . number_format($verifiedTotalAmount, 2),
            'after_json' => [
                'verified_count' => count($allVerifiedIds),
                'verified_amount' => round($verifiedTotalAmount, 2),
                'status' => $stage,
                'business_date' => $businessDate,
                'cashier_user_id' => $cashierId,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $remittance->refresh();
    }

    private function cashlessPaymentsQuery(string $businessDate, int $cashierId)
    {
        return Payment::with(['paymentMethod', 'sale.receipt', 'sale.customer', 'receivedBy', 'noncashVerifier'])
            ->whereHas('sale', function ($query) use ($businessDate, $cashierId) {
                $query->whereDate('sale_datetime', $businessDate)
                    ->where('cashier_user_id', $cashierId)
                    ->where('status', 'paid');
            })
            ->whereHas('paymentMethod', function ($query) {
                $query->where('is_cashless', true);
            });
    }

    private function cashlessTransactionsFor(string $businessDate, int $cashierId): array
    {
        $payments = $this->cashlessPaymentsQuery($businessDate, $cashierId)
            ->orderBy('paid_at')
            ->get();

        return $payments->map(function (Payment $payment) use ($businessDate) {
            return [
                'id' => $payment->id,
                'amount' => (float) $payment->amount,
                'reference' => $payment->reference_no,
                'paid_at' => $payment->paid_at?->toDateTimeString(),
                'method_key' => $payment->paymentMethod?->method_key,
                'method_name' => $payment->paymentMethod?->name,
                'sale_number' => $payment->sale?->sale_number,
                'receipt_number' => $payment->sale?->receipt?->receipt_number,
                'customer' => $payment->sale?->customer?->name ?? 'Walk in',
                'recorded_by' => $payment->receivedBy?->name,
                'verified' => (bool) $payment->noncash_verified_at,
                'verified_at' => $payment->noncash_verified_at?->toDateTimeString(),
                'verified_by' => $payment->noncashVerifier?->name,
                'status' => $payment->noncash_verified_at ? 'verified' : 'pending',
                'business_date' => $businessDate,
            ];
        })->toArray();
    }

    private function deriveStage(?Remittance $remittance, bool $finalized): string
    {
        if ($finalized) {
            return 'finalized';
        }

        $cashRecorded = $remittance?->remitted_cash_amount !== null;
        $cashlessVerified = $remittance?->noncash_verified_at !== null;

        return $this->stageFromFlags((bool) $cashRecorded, (bool) $cashlessVerified, $finalized);
    }

    private function stageFromFlags(bool $cashRecorded, bool $cashlessVerified, bool $finalized): string
    {
        if ($finalized) {
            return 'finalized';
        }

        if ($cashRecorded && $cashlessVerified) {
            return 'ready_to_finalize';
        }

        if ($cashlessVerified) {
            return 'cashless_verified';
        }

        if ($cashRecorded) {
            return 'cash_recorded';
        }

        return 'draft';
    }

    private function persistCashTurnover(
        Request $request,
        string $businessDate,
        int $cashierId,
        float $cashCounted,
        ?string $note,
        User $user,
        LedgerService $ledger
    ): Remittance {
        $expected = $this->expectedForRow($businessDate, $cashierId);
        $existing = Remittance::where('business_date', $businessDate)
            ->where('cashier_user_id', $cashierId)
            ->first();

        $variance = round($cashCounted - $expected['expected_cash'], 2);
        $noteText = Str::of($note ?? '')->trim();

        if ($variance !== 0.0 && $noteText->length() < 3) {
            throw new InvalidArgumentException('Provide a short note when cash variance is not zero.');
        }

        $previous = (float) ($existing?->remitted_cash_amount ?? 0);
        $cashlessVerified = (bool) ($existing?->noncash_verified_at);
        $status = $this->stageFromFlags(true, $cashlessVerified, false);

        $remittance = Remittance::updateOrCreate(
            [
                'business_date' => $businessDate,
                'cashier_user_id' => $cashierId,
            ],
            [
                'accountant_user_id' => $user->id,
                'expected_amount' => $expected['expected_cash'],
                'expected_cash' => $expected['expected_cash'],
                'expected_noncash_total' => $expected['expected_noncash_total'],
                'expected_by_method' => $expected['expected_by_method'],
                'remitted_amount' => $cashCounted,
                'remitted_cash_amount' => $cashCounted,
                'variance_amount' => $variance,
                'cash_variance' => $variance,
                'status' => $status,
                'note' => $noteText->length() ? $noteText->toString() : null,
                'recorded_at' => now(),
            ]
        );

        $delta = $cashCounted - $previous;
        if ($delta !== 0.0) {
            $refType = $existing ? 'remittance_adjustment' : 'remittance';
            $deltaAbs = abs($delta);
            $isPositive = $delta > 0;
            $ledger->postEntry([
                'entry_date' => $businessDate,
                'reference_type' => $refType,
                'reference_id' => $remittance->id,
                'created_by_user_id' => $user->id,
                'memo' => "Cashier remittance {$businessDate}",
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
            'message' => "Recorded cash turnover for {$businessDate} (variance: " . number_format($variance, 2) . ")",
            'after_json' => [
                'status' => $status,
                'business_date' => $businessDate,
                'cashier_user_id' => $cashierId,
                'cash_counted' => round($cashCounted, 2),
                'expected_cash' => round($expected['expected_cash'] ?? 0, 2),
                'expected_noncash_total' => round($expected['expected_noncash_total'] ?? 0, 2),
                'cash_variance' => round($variance, 2),
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $remittance->refresh();
    }

    private function pendingCashlessTransactionIds(string $businessDate, int $cashierId): array
    {
        return $this->cashlessPaymentsQuery($businessDate, $cashierId)
            ->whereNull('payments.noncash_verified_at')
            ->pluck('payments.id')
            ->all();
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

    private function buildTurnoverBaseQuery(string $fromDate, string $toDate)
    {
        $expectedTotals = $this->buildExpectedTotalsQuery($fromDate, $toDate);

        return DB::query()
            ->fromSub($expectedTotals, 'expected')
            ->leftJoin('remittances as r', function ($join) {
                $join->on('r.business_date', '=', 'expected.business_date')
                    ->on('r.cashier_user_id', '=', 'expected.cashier_user_id');
            })
            ->leftJoin('daily_closes as dc', 'dc.business_date', '=', 'expected.business_date');
    }

    private function applyTurnoverFilters($query, array $filters): void
    {
        if (!empty($filters['q'])) {
            $query->where('expected.cashier_name', 'like', '%' . $filters['q'] . '%');
        }

        if (($filters['status'] ?? 'all') !== 'all') {
            $query->whereRaw($this->statusCaseSql() . ' = ?', [$filters['status']]);
        }
    }

    private function buildExpectedTotalsQuery(string $fromDate, string $toDate)
    {
        return DB::table('payments as p')
            ->join('payment_methods as pm', 'pm.id', '=', 'p.payment_method_id')
            ->join('sales as s', 's.id', '=', 'p.sale_id')
            ->join('users as u', 'u.id', '=', 's.cashier_user_id')
            ->whereDate('s.sale_datetime', '>=', $fromDate)
            ->whereDate('s.sale_datetime', '<=', $toDate)
            ->where('s.status', 'paid')
            ->selectRaw('DATE(s.sale_datetime) as business_date')
            ->selectRaw('s.cashier_user_id as cashier_user_id')
            ->selectRaw('u.name as cashier_name')
            ->selectRaw('SUM(CASE WHEN LOWER(pm.method_key) = \'cash\' THEN p.amount ELSE 0 END) as expected_cash')
            ->selectRaw('SUM(CASE WHEN LOWER(pm.method_key) <> \'cash\' THEN p.amount ELSE 0 END) as expected_noncash_total')
            ->groupBy('business_date', 's.cashier_user_id', 'u.name');
    }

    private function loadExpectedByMethodForRows(Collection $rows, Collection $methods): array
    {
        if ($rows->isEmpty()) {
            return [];
        }

        $pairs = $rows
            ->map(fn ($row) => [$row->business_date, $row->cashier_user_id])
            ->unique(fn ($pair) => $pair[0] . '::' . $pair[1])
            ->values();

        if ($pairs->isEmpty()) {
            return [];
        }

        $query = DB::table('payments as p')
            ->join('payment_methods as pm', 'pm.id', '=', 'p.payment_method_id')
            ->join('sales as s', 's.id', '=', 'p.sale_id')
            ->where('s.status', 'paid')
            ->where(function ($sub) use ($pairs) {
                foreach ($pairs as $pair) {
                    [$date, $cashierId] = $pair;
                    $sub->orWhere(function ($inner) use ($date, $cashierId) {
                        $inner->whereDate('s.sale_datetime', $date)
                            ->where('s.cashier_user_id', $cashierId);
                    });
                }
            })
            ->selectRaw('DATE(s.sale_datetime) as business_date, s.cashier_user_id, pm.method_key, SUM(p.amount) as amount')
            ->groupBy('business_date', 's.cashier_user_id', 'pm.method_key')
            ->get();

        $map = [];
        foreach ($query as $row) {
            $key = $row->business_date . '::' . $row->cashier_user_id;
            $map[$key][$row->method_key] = (float) $row->amount;
        }

        foreach ($pairs as $pair) {
            [$date, $cashierId] = $pair;
            $key = $date . '::' . $cashierId;
            $map[$key] = $map[$key] ?? [];
            foreach ($methods as $method) {
                if (!array_key_exists($method->method_key, $map[$key])) {
                    $map[$key][$method->method_key] = 0.0;
                }
            }
        }

        return $map;
    }

    private function buildTurnoverKpis(string $fromDate, string $toDate, array $filters): array
    {
        $query = $this->buildTurnoverBaseQuery($fromDate, $toDate);
        $this->applyTurnoverFilters($query, $filters);

        $totals = $query->selectRaw(
            'COALESCE(SUM(expected.expected_cash), 0) as expected_cash,
            COALESCE(SUM(expected.expected_noncash_total), 0) as expected_noncash_total,
            COALESCE(SUM(r.remitted_cash_amount), 0) as cash_recorded,
            COALESCE(SUM(' . $this->cashVarianceSql() . '), 0) as cash_variance,
            COALESCE(SUM(' . $this->noncashVerifiedTotalSql() . '), 0) as cashless_verified_total,
            COALESCE(SUM(' . $this->noncashVerifiedCountSql() . '), 0) as cashless_verified_count,
            COALESCE(SUM(CASE WHEN dc.business_date IS NULL THEN 0 ELSE 1 END), 0) as finalized_count'
        )->first();

        $expectedCash = (float) ($totals->expected_cash ?? 0);
        $expectedNonCash = (float) ($totals->expected_noncash_total ?? 0);

        return [
            'projected_income' => round($expectedCash + $expectedNonCash, 2),
            'expected_cash' => round($expectedCash, 2),
            'expected_non_cash' => round($expectedNonCash, 2),
            'cash_recorded' => round((float) ($totals->cash_recorded ?? 0), 2),
            'cash_variance' => round((float) ($totals->cash_variance ?? 0), 2),
            'cashless_verified_total' => round((float) ($totals->cashless_verified_total ?? 0), 2),
            'cashless_verified_count' => (int) ($totals->cashless_verified_count ?? 0),
            'finalized_count' => (int) ($totals->finalized_count ?? 0),
        ];
    }

    private function statusCaseSql(): string
    {
        return "CASE
            WHEN dc.business_date IS NOT NULL THEN 'finalized'
            WHEN r.remitted_cash_amount IS NOT NULL AND r.noncash_verified_at IS NOT NULL THEN 'ready_to_finalize'
            WHEN r.noncash_verified_at IS NOT NULL THEN 'cashless_verified'
            WHEN r.remitted_cash_amount IS NOT NULL THEN 'cash_recorded'
            ELSE 'draft'
        END";
    }

    private function cashVarianceSql(): string
    {
        return "COALESCE(r.cash_variance, CASE WHEN r.remitted_cash_amount IS NOT NULL THEN (r.remitted_cash_amount - expected.expected_cash) ELSE NULL END)";
    }

    private function noncashVerifiedTotalSql(): string
    {
        return "COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(r.noncash_verification, '$.amount')) AS DECIMAL(12,2)), 0)";
    }

    private function noncashVerifiedCountSql(): string
    {
        return "COALESCE(JSON_LENGTH(JSON_EXTRACT(r.noncash_verification, '$.transaction_ids')), 0)";
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
