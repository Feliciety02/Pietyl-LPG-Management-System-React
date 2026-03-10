<?php

namespace App\Http\Controllers\Cashier;

use App\Exports\SalesCsvExport;
use App\Exports\SalesReportExport;
use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Services\DailySummaryService;
use App\Services\SaleService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SaleController extends Controller
{
    protected SaleService $saleService;
    protected DailySummaryService $summaryService;

    public function __construct(SaleService $saleService, DailySummaryService $summaryService)
    {
        $this->saleService = $saleService;
        $this->summaryService = $summaryService;
    }

    // -------------------------------------------------------------------------
    // Pages
    // -------------------------------------------------------------------------

    public function index(Request $request): InertiaResponse
    {
        return $this->renderSalesPage($request, 'CashierPage/Sales');
    }

    public function indexAccountant(Request $request): InertiaResponse
    {
        return $this->renderSalesPage($request, 'AccountantPage/Sales');
    }

    protected function renderSalesPage(Request $request, string $view): InertiaResponse
    {
        $summaryDate = $request->input('summary_date', now()->toDateString());

        $filters = [
            'q'            => $request->input('q'),
            'status'       => $request->input('status', 'all'),
            'per'          => $request->input('per', 10),
            'page'         => $request->input('page', 1),
            'summary_date' => $summaryDate,
        ];

        $sales          = $this->saleService->getSalesForPage($filters);
        $summaryPayload = $this->summaryService->getSummary($summaryDate);

        return Inertia::render($view, [
            'sales'                  => $sales,
            'filters'                => $filters,
            'daily_summary'          => $summaryPayload['summary'],
            'daily_summary_turnover' => $summaryPayload['cashier_turnover'],
        ]);
    }

    // -------------------------------------------------------------------------
    // JSON / AJAX
    // -------------------------------------------------------------------------

    public function latest(Request $request): JsonResponse
    {
        $filters = [
            'q'            => $request->input('q'),
            'status'       => $request->input('status', 'all'),
            'per'          => $request->input('per', 10),
            'page'         => $request->input('page', 1),
            'summary_date' => $request->input('summary_date'),
        ];

        return response()->json($this->saleService->getSalesForPage($filters), 200);
    }

    // -------------------------------------------------------------------------
    // Export
    // -------------------------------------------------------------------------

    public function export(Request $request)
    {
        $validated = Validator::make([
            'from_date'    => $request->input('from_date') ?? $request->input('from'),
            'to_date'      => $request->input('to_date') ?? $request->input('to'),
            'status_scope' => $request->input('status_scope') ?? $request->input('status') ?? 'paid',
            'format'       => strtolower((string) $request->input('format', 'xlsx')),
            'include_items' => $request->input('include_items', false),
        ], [
            'from_date'    => ['required', 'date'],
            'to_date'      => ['required', 'date', 'after_or_equal:from_date'],
            'status_scope' => ['required', 'in:paid,paid_pending,pending,failed,all'],
            'format'       => ['sometimes', 'in:xlsx,csv'],
            'include_items' => ['sometimes', 'boolean'],
        ])->validate();

        $from         = Carbon::parse($validated['from_date'])->startOfDay();
        $to           = Carbon::parse($validated['to_date'])->endOfDay();
        $statusScope  = $validated['status_scope'];
        $format       = $validated['format'] ?? 'xlsx';
        $includeItems = filter_var($validated['include_items'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $sales        = $this->saleService->getSalesForExport([
            'from'         => $from->toDateString(),
            'to'           => $to->toDateString(),
            'status_scope' => $statusScope,
        ]);

        $summary      = $this->saleService->buildExportSummary($sales);
        $methodTotals = $this->saleService->buildMethodTotals($sales);
        $statusLabel  = $this->saleService->resolveStatusLabel($statusScope);
        $rangeLabel   = sprintf('%s to %s', $from->format('M d, Y'), $to->format('M d, Y'));
        $fileBase     = sprintf('Sales_%s_to_%s', $from->format('Y-m-d'), $to->format('Y-m-d'));

        try {
            if ($format === 'csv') {
                return Excel::download(
                    new SalesCsvExport($sales, $methodTotals, $summary, $rangeLabel, $statusLabel),
                    $fileBase . '.csv',
                    \Maatwebsite\Excel\Excel::CSV
                );
            }

            return Excel::download(
                new SalesReportExport($sales, $methodTotals, $summary, $rangeLabel, $statusLabel, $includeItems),
                $fileBase . '.xlsx'
            );

        } catch (\Throwable $e) {
            Log::error('SaleController: export generation failed', [
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['export' => 'Failed to generate export file. Please try again.']);
        }
    }

    // -------------------------------------------------------------------------
    // Receipt
    // -------------------------------------------------------------------------

    public function receipt(Sale $sale): JsonResponse
    {
        try {
            return response()->json($this->saleService->buildReceiptPayload($sale), 200);

        } catch (\Throwable $e) {
            Log::error('Failed to load receipt payload', [
                'sale_id' => $sale->id,
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error'   => 'Failed to load receipt.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function reprint(Sale $sale): JsonResponse
    {
        try {
            $receipt = $this->saleService->findOrCreateReceiptForSale($sale->id);
            $this->saleService->incrementReceiptPrintCount($receipt);

            return response()->json($this->saleService->buildReceiptPayload($sale), 200);

        } catch (\Throwable $e) {
            Log::error('Reprint method error', [
                'sale_id' => $sale->id,
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error'   => 'Failed to reprint receipt.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function printReceipt(Sale $sale)
    {
        try {
            $payload = $this->saleService->buildReceiptPayload($sale);
            $format  = request()->query('format');

            if (strtolower((string) $format) === 'pdf' && class_exists(Pdf::class)) {
                $pdf      = Pdf::loadView('receipts.print', ['sale' => $payload]);
                $fileName = sprintf('Receipt_%s.pdf', $payload['ref'] ?? $sale->id);
                return $pdf->download($fileName);
            }

            return view('receipts.print', ['sale' => $payload]);

        } catch (\Throwable $e) {
            Log::error('Failed to generate receipt view', [
                'sale_id' => $sale->id,
                'error'   => $e->getMessage(),
            ]);

            return response()->json([
                'error'   => 'Failed to generate receipt.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}