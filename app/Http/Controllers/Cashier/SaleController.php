<?php

namespace App\Http\Controllers\Cashier;

use App\Exports\SalesReportExport;
use App\Http\Controllers\Controller;
use App\Services\DailySummaryService;
use App\Services\SaleService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class SaleController extends Controller
{
    protected SaleService $saleService;
    protected DailySummaryService $summaryService;

    public function __construct(SaleService $saleService, DailySummaryService $summaryService)
    {
        $this->saleService = $saleService;
        $this->summaryService = $summaryService;
    }

    public function index(Request $request)
    {
        $summaryDate = $request->input('summary_date', now()->toDateString());

        $filters = [
            'q' => $request->input('q'),
            'status' => $request->input('status', 'all'),
            'per' => $request->input('per', 10),
            'page' => $request->input('page', 1),
            'summary_date' => $summaryDate,
        ];

        $sales = $this->saleService->getSalesForPage($filters);

        $summaryPayload = $this->summaryService->getSummary($summaryDate);

        return Inertia::render('CashierPage/Sales', [
            'sales' => $sales,
            'filters' => $filters,
            'daily_summary' => $summaryPayload['summary'],
            'daily_summary_turnover' => $summaryPayload['cashier_turnover'],
        ]);
    }

    public function latest(Request $request)
    {
        $filters = [
            'q' => $request->input('q'),
            'status' => $request->input('status', 'all'),
            'per' => $request->input('per', 10),
            'page' => $request->input('page', 1),
        ];

        return response()->json($this->saleService->getSalesForPage($filters));
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'from_date' => ['required', 'date'],
            'to_date' => ['required', 'date', 'after_or_equal:from_date'],
            'status_scope' => ['required', 'in:paid,paid_pending,all'],
            'include_items' => ['sometimes', 'boolean'],
        ]);

        $from = Carbon::parse($validated['from_date'])->startOfDay();
        $to = Carbon::parse($validated['to_date'])->endOfDay();
        $statusScope = $validated['status_scope'];
        $includeItems = filter_var($validated['include_items'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $sales = $this->saleService->getSalesForExport([
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'status_scope' => $statusScope,
        ]);

        $summary = [
            'count' => $sales->count(),
            'total' => $sales->sum('grand_total'),
        ];

        $methodTotals = $sales
            ->flatMap(fn ($sale) => $sale->payments->map(fn ($payment) => [
                'method' => $payment->paymentMethod?->method_key ?? 'cash',
                'amount' => $payment->amount,
            ]))
            ->groupBy('method')
            ->map(fn ($items) => $items->sum('amount'))
            ->toArray();

        $statusLabels = [
            'paid' => 'Paid only',
            'paid_pending' => 'Paid + Pending',
            'all' => 'All statuses',
        ];

        $fileName = sprintf(
            'Sales_%s_to_%s.xlsx',
            $from->format('Y-m-d'),
            $to->format('Y-m-d')
        );

        $rangeLabel = sprintf(
            '%s to %s',
            $from->format('M d, Y'),
            $to->format('M d, Y')
        );

        return Excel::download(
            new SalesReportExport(
                $sales,
                $methodTotals,
                $summary,
                $rangeLabel,
                $statusLabels[$statusScope] ?? 'Paid only',
                $includeItems
            ),
            $fileName
        );
    }
}
