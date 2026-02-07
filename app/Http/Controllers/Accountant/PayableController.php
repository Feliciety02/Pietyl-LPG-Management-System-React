<?php

namespace App\Http\Controllers\Accountant;

use App\Http\Controllers\Controller;
use App\Models\RestockRequest;
use App\Models\SupplierPayable;
use App\Services\Accounting\LedgerService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PayableController extends Controller
{
    protected LedgerService $ledgerService;

    public function __construct(LedgerService $ledgerService)
    {
        $this->ledgerService = $ledgerService;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->hasRole('accountant')) {
            abort(403);
        }

        $filters = [
            'q' => $request->input('q', ''),
            'supplier' => $request->input('supplier'),
            'status' => $request->input('status', 'all'),
            'per' => (int) $request->input('per', 10),
            'page' => (int) $request->input('page', 1),
        ];

        $query = SupplierPayable::with(['supplier', 'source']);

        if ($filters['supplier']) {
            $query->where('supplier_id', $filters['supplier']);
        }

        if ($filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if ($filters['q']) {
            $q = $filters['q'];
            $query->where(function ($sub) use ($q) {
                $sub->where('source_id', 'like', "%{$q}%")
                    ->orWhere('payment_method', 'like', "%{$q}%")
                    ->orWhereHas('supplier', fn ($supplier) => $supplier->where('name', 'like', "%{$q}%"));
            });
        }

        $paginated = $query->orderBy('created_at', 'desc')->paginate($filters['per'])->withQueryString();

        $summary = [
            'total_unpaid_amount' => (float) SupplierPayable::where('status', SupplierPayable::STATUS_UNPAID)->sum('amount'),
            'count_unpaid' => SupplierPayable::where('status', SupplierPayable::STATUS_UNPAID)->count(),
        ];

        return Inertia::render('AccountantPage/Payables', [
            'payables' => [
                'data' => $paginated->map(function (SupplierPayable $payable) {
                    return [
                        'id' => $payable->id,
                        'supplier_name' => $payable->supplier?->name,
                        'source_ref' => $payable->source_type === RestockRequest::class ? $payable->source->request_number : $payable->source_id,
                        'amount' => (float) $payable->amount,
                        'status' => $payable->status,
                        'created_at' => $payable->created_at?->format('M d, Y g:i A'),
                        'source_type' => $payable->source_type,
                    ];
                })->all(),
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'from' => $paginated->firstItem(),
                    'to' => $paginated->lastItem(),
                    'total' => $paginated->total(),
                    'per_page' => $paginated->perPage(),
                ],
            ],
            'filters' => $filters,
            'summary' => $summary,
        ]);
    }

    public function show(Request $request, SupplierPayable $payable)
    {
        $user = $request->user();
        if (!$user || !$user->hasRole('accountant')) {
            abort(403);
        }

        $payable->load(['supplier', 'source']);

        return Inertia::render('AccountantPage/PayableDetails', [
            'payable' => [
                'id' => $payable->id,
                'supplier' => $payable->supplier?->only(['id', 'name']),
                'amount' => (float) $payable->amount,
                'status' => $payable->status,
                'source_ref' => $payable->source_type === RestockRequest::class ? $payable->source->request_number : $payable->source_id,
                'source_type' => $payable->source_type,
            ],
        ]);
    }

    public function pay(Request $request, SupplierPayable $payable)
    {
        $user = $request->user();
        if (!$user || !$user->hasRole('accountant')) {
            abort(403);
        }

        if ($payable->status !== SupplierPayable::STATUS_UNPAID) {
            return redirect()->back()->with('error', 'Payable already settled.');
        }

        $validated = $request->validate([
            'payment_method' => 'required|string',
            'bank_ref' => 'nullable|string',
            'paid_amount' => 'nullable|numeric|min:0',
        ]);

        $amount = $validated['paid_amount'] ?? (float) $payable->amount;

        if (abs($amount - (float) $payable->amount) > 0.01) {
            throw ValidationException::withMessages([
                'paid_amount' => 'Paid amount must equal payable balance.',
            ]);
        }

        $creditAccount = $this->mapPaymentMethodToAccount($validated['payment_method']);

        $entry = $this->ledgerService->postEntry([
            'reference_type' => SupplierPayable::class,
            'reference_id' => $payable->id,
            'created_by_user_id' => $user->id,
            'memo' => "Supplier payment ({$payable->supplier?->name})",
            'lines' => [
                [
                    'account_code' => '2100',
                    'debit' => $amount,
                    'description' => 'Accounts payable cleared',
                ],
                [
                    'account_code' => $creditAccount,
                    'credit' => $amount,
                    'description' => 'Cash outflow',
                ],
            ],
        ]);

        $payable->update([
            'status' => SupplierPayable::STATUS_PAID,
            'paid_by_user_id' => $user->id,
            'paid_at' => now(),
            'payment_method' => $validated['payment_method'],
            'bank_ref' => $validated['bank_ref'] ?? null,
            'ledger_entry_id' => $entry->id,
        ]);

        $requestEntity = $payable->source;
        if ($requestEntity instanceof RestockRequest) {
            $requestEntity->update([
                'status' => RestockRequest::STATUS_PAID,
            ]);
        }

        return redirect()->route('dash.accountant.payables')->with('success', 'Payment recorded.');
    }

    protected function mapPaymentMethodToAccount(string $method): string
    {
        $method = strtolower($method);
        if (str_contains($method, 'bank') || str_contains($method, 'transfer')) {
            return '1020';
        }

        if (str_contains($method, 'cash')) {
            return '1010';
        }

        return '1010';
    }
}
