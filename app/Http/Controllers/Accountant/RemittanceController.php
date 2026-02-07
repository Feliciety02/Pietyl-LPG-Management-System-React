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
use Illuminate\Pagination\LengthAwarePaginator;
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
        $expectedRows = $this->loadExpectedRows($fromDate, $toDate);

        $remittances = Remittance::whereBetween('business_date', [$fromDate, $toDate])
            ->with('noncashVerifier')
            ->get()
            ->keyBy(function (Remittance $remittance) {
                return $remittance->business_date->toDateString() . '::' . $remittance->cashier_user_id;
            });

        $finalizedDates = DailyClose::whereBetween('business_date', [$fromDate, $toDate])
            ->pluck('business_date')
            ->map(fn ($date) => $date->toDateString())
            ->all();

        $rows = $expectedRows->map(function ($item) use ($remittances, $finalizedDates) {
            $key = $item['business_date'] . '::' . $item['cashier_user_id'];
            $record = $remittances->get($key);

            $cashVariance = $record?->cash_variance;
            if ($cashVariance === null && $record?->remitted_cash_amount !== null) {
                $cashVariance = round($record->remitted_cash_amount - $item['expected_cash'], 2);
            }

            $finalized = in_array($item['business_date'], $finalizedDates, true);
            $stage = $this->deriveStage($record, $finalized);
            $verification = $record?->noncash_verification ?? [];
            $verifiedTransactionIds = is_array($verification['transaction_ids'] ?? null)
                ? $verification['transaction_ids']
                : [];
            $noncashVerifiedAmount = round((float) ($verification['amount'] ?? 0), 2);

            return [
                'id' => $record?->id,
                'business_date' => $item['business_date'],
                'cashier_user_id' => $item['cashier_user_id'],
                'cashier_name' => $item['cashier_name'],
                'expected_cash' => $item['expected_cash'],
                'expected_cashless_total' => $item['expected_noncash_total'],
                'expected_noncash_total' => $item['expected_noncash_total'],
                'expected_by_method' => $item['expected_by_method'],
                'remitted_cash_amount' => $record?->remitted_cash_amount,
                'cash_counted' => $record?->remitted_cash_amount,
                'cash_variance' => is_null($cashVariance) ? null : (float) round($cashVariance, 2),
                'cash_status' => $stage,
                'status' => $stage,
                'finalized' => $finalized,
                'note' => $record?->note,
                'recorded_at' => $record?->recorded_at?->format('Y-m-d H:i') ?? '-',
                'noncash_verified_at' => $record?->noncash_verified_at?->format('Y-m-d H:i'),
                'noncash_verified_by' => $record?->noncashVerifier?->name,
                'noncash_verification' => $record?->noncash_verification ?? [],
                'noncash_status' => $record?->noncash_verified_at ? 'verified' : 'unverified',
                'noncash_verified_total' => $noncashVerifiedAmount,
                'noncash_verified_count' => count($verifiedTransactionIds),
                'verified_transaction_ids' => $verifiedTransactionIds,
            ];
        });

        if (!empty($filters['q'])) {
            $q = mb_strtolower($filters['q']);
            $rows = $rows->filter(fn ($row) => str_contains(mb_strtolower($row['cashier_name'] ?? ''), $q));
        }

        if ($filters['status'] !== 'all') {
            $rows = $rows->filter(fn ($row) => $row['status'] === $filters['status']);
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
