<?php

namespace App\Http\Controllers\Accountant;

use App\Http\Controllers\Controller;
use App\Models\LedgerLine;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;

class LedgerController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'q' => $request->input('q', ''),
            'type' => $request->input('type', 'all'),
            'account' => $request->input('account', 'all'),
            'per' => (int) $request->input('per', 10),
            'page' => (int) $request->input('page', 1),
        ];

        $query = LedgerLine::query()
            ->with(['entry.createdBy', 'account'])
            ->join('ledger_entries as le', 'le.id', '=', 'ledger_lines.ledger_entry_id')
            ->join('chart_of_accounts as coa', 'coa.id', '=', 'ledger_lines.account_id')
            ->select('ledger_lines.*', 'le.entry_date', 'le.reference_type', 'le.reference_id', 'le.created_by_user_id', 'coa.code as account_code', 'coa.name as account_name');

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

        $lines = $query->orderBy('le.entry_date')
            ->orderBy('ledger_lines.id')
            ->get();

        $balances = [];
        $mapped = $lines->map(function ($line) use (&$balances) {
            $code = $line->account_code;
            $balances[$code] = ($balances[$code] ?? 0) + (float) $line->debit - (float) $line->credit;

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
                'balance' => $balances[$code],
                'posted_by' => $line->entry?->createdBy?->name ?? 'System',
            ];
        });

        $total = $mapped->count();
        $per = max(1, $filters['per']);
        $page = max(1, $filters['page']);
        $items = $mapped->slice(($page - 1) * $per, $per)->values();

        $paginator = new LengthAwarePaginator($items, $total, $per, $page, [
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
        ]);
    }
}
