<?php

namespace App\Http\Controllers\Accountant;

use App\Http\Controllers\Controller;
use App\Models\PayableLedger;
use App\Models\Purchase;
use App\Models\RestockRequest;
use App\Models\SupplierPayable;
use App\Services\Accounting\LedgerService;
use App\Services\Accounting\PayableService;
use App\Enums\PurchaseStatus;
use App\Exceptions\PurchaseStatusException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PayableController extends Controller
{
    protected LedgerService $ledgerService;
    protected PayableService $payableService;

    public function __construct(LedgerService $ledgerService, PayableService $payableService)
    {
        $this->ledgerService = $ledgerService;
        $this->payableService = $payableService;
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

        $query = SupplierPayable::with(['supplier', 'source', 'source.items.productVariant.product']);

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

        $amountColumn = Schema::hasColumn('supplier_payables', 'net_amount') ? 'net_amount' : 'amount';
        $deductionsColumn = Schema::hasColumn('supplier_payables', 'deductions_total') ? 'deductions_total' : null;

        $summary = [
            'total_unpaid_amount' => (float) SupplierPayable::where('status', SupplierPayable::STATUS_UNPAID)->sum($amountColumn),
            'count_unpaid' => SupplierPayable::where('status', SupplierPayable::STATUS_UNPAID)->count(),
            'damage_adjustment' => $deductionsColumn
                ? round((float) SupplierPayable::where('status', SupplierPayable::STATUS_UNPAID)->sum($deductionsColumn), 2)
                : 0.0,
        ];

        return Inertia::render('AccountantPage/Payables', [
            'payables' => [
                'data' => $paginated->map(function (SupplierPayable $payable) use ($amountColumn) {
                    $source = $payable->source;
                    $isPurchase = $source instanceof Purchase;
                    $purchaseItem = $isPurchase ? $source?->items?->first() : null;
                    $product = $purchaseItem?->productVariant?->product;
                    $damageReduction = (float) ($payable->deductions_total ?? 0);
                    $damagedQty = $isPurchase ? (float) ($source?->damaged_qty ?? 0) : 0;
                    $damageCategory = $source?->damage_category;
                    $damageReason = $source?->damage_reason;

                    $payableAmount = (float) ($payable->{$amountColumn} ?? $payable->amount ?? 0);
                    return [
                        'id' => $payable->id,
                        'supplier_name' => $payable->supplier?->name,
                        'supplier_contact_name' => $payable->supplier?->contact_name,
                        'supplier_phone' => $payable->supplier?->phone,
                        'supplier_email' => $payable->supplier?->email,
                        'source_ref' => $payable->source_type === RestockRequest::class
                            ? $payable->source->request_number
                            : ($isPurchase ? $source?->purchase_number : $payable->source_id),
                        'amount' => $payableAmount,
                        'gross_amount' => (float) ($payable->gross_amount ?? 0),
                        'deductions_total' => $damageReduction,
                        'status' => $payable->status,
                        'created_at' => $payable->created_at?->format('M d, Y g:i A'),
                        'source_type' => $payable->source_type,
                        'source_status' => $source?->status,
                        'damage_reduction' => round($damageReduction, 2),
                        'damaged_qty' => round($damagedQty, 3),
                        'purchase' => $isPurchase ? [
                            'id' => $source?->id,
                            'reference_no' => $source?->purchase_number,
                            'supplier_name' => $payable->supplier?->name,
                            'supplier_contact_name' => $payable->supplier?->contact_name,
                            'supplier_phone' => $payable->supplier?->phone,
                            'supplier_email' => $payable->supplier?->email,
                            'supplier_reference_no' => $source?->supplier_reference_no,
                            'delivery_reference_no' => $source?->delivery_reference_no,
                            'product_name' => $product?->name ?? '—',
                            'variant' => $purchaseItem?->productVariant?->variant_name ?? '—',
                            'qty' => (float) ($purchaseItem?->qty ?? 0),
                            'received_qty' => (float) ($purchaseItem?->received_qty ?? 0),
                            'unit_cost' => (float) ($purchaseItem?->unit_cost ?? 0),
                            'total_cost' => (float) ($purchaseItem?->line_total ?? 0),
                            'status' => $source?->status,
                            'created_at' => $source?->created_at?->format('M d h:i A'),
                            'delivered_qty' => (float) ($source?->delivered_qty ?? 0),
                            'damaged_qty' => $damagedQty,
                            'missing_qty' => (float) ($source?->missing_qty ?? 0),
                            'damage_category' => $damageCategory,
                            'damage_reason' => $damageReason,
                            'received_at' => optional($source?->received_at)?->toDateTimeString(),
                        ] : null,
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

        $ledgerTableExists = Schema::hasTable('payable_ledgers');
        $amountColumn = Schema::hasColumn('supplier_payables', 'net_amount') ? 'net_amount' : 'amount';
        $relations = [
            'supplier',
            'source',
            'source.items.productVariant.product',
        ];

        if ($ledgerTableExists) {
            $relations['ledgers'] = fn ($query) => $query->latest()->with('createdBy');
        }

        $payable->load($relations);
        $source = $payable->source;
        $isPurchase = $source instanceof Purchase;
        $purchaseItem = $isPurchase ? $source?->items?->first() : null;
        $product = $purchaseItem?->productVariant?->product;

        $payableData = [
            'id' => $payable->id,
            'supplier' => $payable->supplier?->only(['id', 'name']),
            'amount' => (float) ($payable->{$amountColumn} ?? $payable->amount ?? 0),
            'gross_amount' => (float) ($payable->gross_amount ?? 0),
            'deductions_total' => (float) ($payable->deductions_total ?? 0),
            'status' => $payable->status,
            'supplier_contact_name' => $payable->supplier?->contact_name,
            'supplier_phone' => $payable->supplier?->phone,
            'supplier_email' => $payable->supplier?->email,
            'source_ref' => $payable->source_type === RestockRequest::class
                ? $payable->source->request_number
                : ($isPurchase ? $source?->purchase_number : $payable->source_id),
            'source_type' => $payable->source_type,
            'source_status' => $source?->status,
            'damage_reduction' => (float) ($payable->deductions_total ?? 0),
            'damaged_qty' => (float) ($source?->damaged_qty ?? 0),
            'purchase' => $isPurchase ? [
                'id' => $source?->id,
                'reference_no' => $source?->purchase_number,
                'supplier_name' => $payable->supplier?->name,
                'supplier_contact_name' => $payable->supplier?->contact_name,
                'supplier_phone' => $payable->supplier?->phone,
                'supplier_email' => $payable->supplier?->email,
                'supplier_reference_no' => $source?->supplier_reference_no,
                'delivery_reference_no' => $source?->delivery_reference_no,
                'product_name' => $product?->name ?? '—',
                'variant' => $purchaseItem?->productVariant?->variant_name ?? '—',
                'qty' => (float) ($purchaseItem?->qty ?? 0),
                'received_qty' => (float) ($purchaseItem?->received_qty ?? 0),
                'unit_cost' => (float) ($purchaseItem?->unit_cost ?? 0),
                'total_cost' => (float) ($purchaseItem?->line_total ?? 0),
                'status' => $source?->status,
                'created_at' => $source?->created_at?->format('M d h:i A'),
                'delivered_qty' => (float) ($source?->delivered_qty ?? 0),
                'damaged_qty' => (float) ($source?->damaged_qty ?? 0),
                'missing_qty' => (float) ($source?->missing_qty ?? 0),
                'damage_category' => $source?->damage_category,
                'damage_reason' => $source?->damage_reason,
                'received_at' => optional($source?->received_at)?->toDateTimeString(),
            ] : null,
            'ledger' => $ledgerTableExists
                ? $payable->ledgers->map(function (PayableLedger $ledger) {
                    return [
                        'entry_type' => $ledger->entry_type,
                        'action' => $ledger->entry_type,
                        'amount' => $ledger->amount !== null ? (float) $ledger->amount : null,
                        'reference' => $ledger->reference,
                        'meta' => $ledger->meta ?? [],
                        'payload' => $ledger->meta ?? [],
                        'note' => $ledger->note,
                        'actor' => $ledger->createdBy?->only(['id', 'name']),
                        'created_at' => $ledger->created_at?->toDateTimeString(),
                    ];
                })->all()
                : [],
        ];

        if ($request->wantsJson()) {
            return response()->json(['payable' => $payableData]);
        }

        return Inertia::render('AccountantPage/PayableDetails', [
            'payable' => $payableData,
        ]);
    }

    public function addNote(Request $request, SupplierPayable $payable)
    {
        $user = $request->user();
        if (!$user || !$user->hasRole('accountant')) {
            abort(403);
        }

        $validated = $request->validate([
            'note' => 'required|string|min:3|max:500',
        ]);

        $this->payableService->recordNote($payable, $validated['note'], $user);

        return response()->json(['message' => 'Note recorded.']);
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
        if ($requestEntity instanceof Purchase) {
            try {
                PurchaseStatus::ensureTransition($requestEntity->status, PurchaseStatus::PAID, PurchaseStatus::ROLE_ACCOUNTANT);
                $requestEntity->update(['status' => PurchaseStatus::PAID]);
            } catch (PurchaseStatusException $ex) {
                return redirect()->back()->with('error', $ex->getMessage())->setStatusCode(422);
            }
        }

        $this->payableService->logLedger(
            $payable,
            'payment_recorded',
            [
                'paid_amount' => $amount,
                'payment_method' => $validated['payment_method'],
                'bank_ref' => $validated['bank_ref'] ?? null,
            ],
            $user->id,
            $amount,
            $validated['bank_ref'] ?? null
        );

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
