<?php

namespace App\Http\Controllers\Accountant;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use App\Models\LedgerLine;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;

class LedgerController extends Controller
{
    public function index(Request $request)
    {
        $filters = $this->resolveFilters($request);
        $baseQuery = $this->buildQuery($filters);

        $lines = (clone $baseQuery);
        $this->applySort($lines, $filters['sort']);
        $lines = $lines->get();

        $totalDebit = $lines->sum(fn ($line) => (float) $line->debit);
        $totalCredit = $lines->sum(fn ($line) => (float) $line->credit);

        $balances = [];
        $mapped = $lines->map(function ($line) use (&$balances) {
            $code = $line->account_code;
            $balances[$code] = ($balances[$code] ?? 0) + (float) $line->debit - (float) $line->credit;

            return $this->normalizeLine($line, $balances[$code]);
        });

        $per = max(1, $filters['per']);
        $page = max(1, $filters['page']);
        $items = $mapped->slice(($page - 1) * $per, $per)->values();

        $paginator = new LengthAwarePaginator($items, $mapped->count(), $per, $page, [
            'path' => $request->url(),
            'query' => $request->query(),
        ]);

        return Inertia::render('AccountantPage/Ledger', [
            'ledger' => [
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
            'accounts' => ChartOfAccount::query()
                ->orderBy('code')
                ->get(['code', 'name'])
                ->map(fn ($coa) => [
                    'value' => $coa->code,
                    'label' => "{$coa->code} {$coa->name}",
                ])
                ->toArray(),
            'ledgerTotals' => [
                'debit' => $totalDebit,
                'credit' => $totalCredit,
                'net' => $totalDebit - $totalCredit,
            ],
        ]);
    }

    public function referenceLines(string $referenceId)
    {
        $lines = LedgerLine::query()
            ->with(['entry.createdBy'])
            ->join('ledger_entries as le', 'le.id', '=', 'ledger_lines.ledger_entry_id')
            ->join('chart_of_accounts as coa', 'coa.id', '=', 'ledger_lines.account_id')
            ->where('le.reference_id', $referenceId)
            ->select(
                'ledger_lines.*',
                'le.entry_date',
                'le.reference_type',
                'le.reference_id',
                'coa.code as account_code',
                'coa.name as account_name'
            )
            ->orderBy('le.entry_date')
            ->orderBy('ledger_lines.id')
            ->get();

        $normalized = $lines->map(function ($line) {
            return [
                'id' => $line->id,
                'posted_at' => $line->entry_date,
                'reference_id' => $line->reference_id,
                'reference_type' => $line->reference_type,
                'account_code' => $line->account_code,
                'account_name' => $line->account_name,
                'description' => $line->description,
                'debit' => (float) $line->debit,
                'credit' => (float) $line->credit,
                'posted_by' => $line->entry?->createdBy?->name ?? 'System',
            ];
        });

        $totalDebit = $normalized->sum('debit');
        $totalCredit = $normalized->sum('credit');

        return Response::json([
            'reference_id' => $referenceId,
            'reference_type' => $lines->first()?->reference_type ?? 'entry',
            'posted_at' => optional($lines->first()?->entry_date)?->toDateString(),
            'lines' => $normalized,
            'totals' => [
                'debit' => $totalDebit,
                'credit' => $totalCredit,
                'net' => $totalDebit - $totalCredit,
            ],
            'balanced' => abs($totalDebit - $totalCredit) < 0.01,
        ]);
    }

    public function exportCsv(Request $request)
    {
        $filters = $this->resolveFilters($request);
        $query = $this->buildQuery($filters);
        $this->applySort($query, $filters['sort']);
        $lines = $query->get();

        $filename = "ledger-{$filters['sort']}-" . now()->format('YmdHis') . ".csv";
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($lines) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Posted',
                'Recorded',
                'Reference',
                'Account Code',
                'Account Name',
                'Description',
                'Debit',
                'Credit',
                'Balance',
                'Net Amount',
                'VAT Amount',
                'Cleared',
                'Bank Ref',
                'Posted By',
            ]);

            foreach ($lines as $line) {
                fputcsv($handle, [
                    optional($line->entry_date)->toDateString(),
                    optional($line->created_at)->toDateTimeString(),
                    $line->reference_id,
                    $line->account_code,
                    $line->account_name,
                    $line->description,
                    $line->debit,
                    $line->credit,
                    ($line->debit - $line->credit),
                    $line->sale_net_amount ?? 0,
                    $line->sale_vat_amount ?? 0,
                    $line->cleared ? 'Cleared' : 'Uncleared',
                    $line->bank_ref,
                    $line->entry?->createdBy?->name ?? 'System',
                ]);
            }

            fclose($handle);
        };

        return Response::streamDownload($callback, $filename, $headers);
    }

    public function exportPdf(Request $request)
    {
        $filters = $this->resolveFilters($request);
        $query = $this->buildQuery($filters);
        $this->applySort($query, $filters['sort']);
        $lines = $query->get();

        $html = View::make('exports.accountant.ledger', [
            'lines' => $lines,
            'filters' => $filters,
        ])->render();

        $filename = "ledger-{$filters['sort']}-" . now()->format('YmdHis') . ".pdf";

        return Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->download($filename);
    }

    protected function resolveFilters(Request $request): array
    {
        return [
            'q' => $request->input('q', ''),
            'type' => $request->input('type', 'all'),
            'account' => $request->input('account', 'all'),
            'from' => $request->input('from'),
            'to' => $request->input('to'),
            'sort' => $request->input('sort', 'posted_at_desc'),
            'cleared' => $request->input('cleared', 'all'),
            'bank_ref' => $request->input('bank_ref', ''),
            'per' => (int) $request->input('per', 10),
            'page' => (int) $request->input('page', 1),
        ];
    }

    protected function buildQuery(array $filters)
    {
        $query = LedgerLine::query()
            ->with(['entry.createdBy'])
            ->join('ledger_entries as le', 'le.id', '=', 'ledger_lines.ledger_entry_id')
            ->join('chart_of_accounts as coa', 'coa.id', '=', 'ledger_lines.account_id')
            ->leftJoin('sales as s', function ($join) {
                $join->on('le.reference_id', '=', 's.id')
                    ->where('le.reference_type', 'sale');
            })
            ->select(
                'ledger_lines.*',
                'le.entry_date',
                'le.reference_type',
                'le.reference_id',
                'le.created_at as entry_created_at',
                'coa.code as account_code',
                'coa.name as account_name',
                's.net_amount as sale_net_amount',
                's.vat_amount as sale_vat_amount'
            );

        return $this->applyFilters($query, $filters);
    }

    protected function applyFilters($query, array $filters)
    {
        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $query->where(function ($sub) use ($q) {
                $sub->where('le.reference_type', 'like', "%{$q}%")
                    ->orWhere('le.reference_id', 'like', "%{$q}%")
                    ->orWhere('coa.code', 'like', "%{$q}%")
                    ->orWhere('coa.name', 'like', "%{$q}%")
                    ->orWhere('ledger_lines.description', 'like', "%{$q}%");
            });
        }

        if ($filters['type'] !== 'all') {
            $query->where('le.reference_type', $filters['type']);
        }

        if ($filters['account'] !== 'all') {
            $query->where('coa.code', $filters['account']);
        }

        if ($filters['from']) {
            $query->whereDate('le.entry_date', '>=', $filters['from']);
        }

        if ($filters['to']) {
            $query->whereDate('le.entry_date', '<=', $filters['to']);
        }

        if ($filters['cleared'] === 'cleared') {
            $query->where('ledger_lines.cleared', true);
        } elseif ($filters['cleared'] === 'uncleared') {
            $query->where('ledger_lines.cleared', false);
        }

        if ($filters['bank_ref']) {
            $query->where('ledger_lines.bank_ref', 'like', "%{$filters['bank_ref']}%");
        }

        return $query;
    }

    protected function applySort($query, string $sort)
    {
        switch ($sort) {
            case 'posted_at_asc':
                $query->orderBy('le.entry_date')->orderBy('ledger_lines.id');
                break;
            case 'created_at_asc':
                $query->orderBy('ledger_lines.created_at')->orderBy('ledger_lines.id');
                break;
            case 'created_at_desc':
                $query->orderBy('ledger_lines.created_at', 'desc')->orderBy('ledger_lines.id', 'desc');
                break;
            case 'posted_at_desc':
            default:
                $query->orderBy('le.entry_date', 'desc')->orderBy('ledger_lines.id', 'desc');
                break;
        }

        return $query;
    }

    protected function normalizeLine($line, float $balance)
    {
        return [
            'id' => $line->id,
            'posted_at' => $line->entry_date,
            'reference_type' => $line->reference_type ?? 'entry',
            'reference_id' => $line->reference_id ? (string) $line->reference_id : null,
            'account_code' => $line->account_code,
            'account_name' => $line->account_name,
            'description' => $line->description,
            'debit' => (float) $line->debit,
            'credit' => (float) $line->credit,
            'balance' => $balance,
            'cleared' => (bool) $line->cleared,
            'bank_ref' => $line->bank_ref,
            'created_at' => optional($line->created_at)->toDateTimeString(),
            'posted_by' => $line->entry?->createdBy?->name ?? 'System',
            'sale_net_amount' => (float) ($line->sale_net_amount ?? 0),
            'sale_vat_amount' => (float) ($line->sale_vat_amount ?? 0),
        ];
    }
}
