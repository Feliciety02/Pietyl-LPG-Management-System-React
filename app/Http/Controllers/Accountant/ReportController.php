<?php

namespace App\Http\Controllers\Accountant;

use App\Http\Controllers\Controller;
use App\Exports\AccountingReportExport;
use App\Models\AccountingReport;
use App\Models\Remittance;
use App\Models\Sale;
use App\Services\Accounting\CostingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'q' => $request->input('q', ''),
            'type' => $request->input('type', 'sales'),
            'from' => $request->input('from', now()->startOfMonth()->toDateString()),
            'to' => $request->input('to', now()->toDateString()),
            'per' => (int) $request->input('per', 10),
            'page' => (int) $request->input('page', 1),
        ];

        $query = AccountingReport::query();

        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $query->where('report_type', 'like', "%{$q}%");
        }

        if (!empty($filters['type'])) {
            $query->where('report_type', $filters['type']);
        }

        if (!empty($filters['from'])) {
            $query->whereDate('date_from', '>=', $filters['from']);
        }

        if (!empty($filters['to'])) {
            $query->whereDate('date_to', '<=', $filters['to']);
        }

        $reports = $query->orderByDesc('generated_at')
            ->paginate($filters['per'])
            ->withQueryString();

        $data = $reports->getCollection()->map(function ($r) {
            return [
                'id' => $r->id,
                'report_type' => $r->report_type,
                'date_from' => $r->date_from->toDateString(),
                'date_to' => $r->date_to->toDateString(),
                'total_sales' => $r->total_sales,
                'total_cash' => $r->total_cash,
                'total_non_cash' => $r->total_non_cash,
                'total_remitted' => $r->total_remitted,
                'variance_total' => $r->variance_total,
                'generated_at' => $r->generated_at?->format('Y-m-d H:i:s'),
                'generated_by' => $r->generatedBy?->name,
            ];
        });

        $fromDate = Carbon::parse($filters['from'])->startOfDay();
        $toDate = Carbon::parse($filters['to'])->endOfDay();

        $transactions = $this->buildReportTransactions($filters['type'], $fromDate, $toDate);

        return Inertia::render('AccountantPage/Reports', [
            'reports' => [
                'data' => $data,
                'meta' => [
                    'current_page' => $reports->currentPage(),
                    'last_page' => $reports->lastPage(),
                    'from' => $reports->firstItem(),
                    'to' => $reports->lastItem(),
                    'total' => $reports->total(),
                ],
            ],
            'filters' => $filters,
            'transactions' => $transactions,
        ]);
    }

    public function export(Request $request, CostingService $costing)
    {
        $format = strtolower($request->input('format', 'csv'));
        if (!in_array($format, ['csv', 'pdf', 'xlsx'], true)) {
            return back()->with('error', 'Unsupported report export format.');
        }

        $reportType = $request->input('type', 'sales');
        $from = $request->input('from', now()->startOfMonth()->toDateString());
        $to = $request->input('to', now()->toDateString());

        if ($request->filled('id')) {
            $report = AccountingReport::findOrFail($request->input('id'));
            $reportType = $report->report_type;
            $from = $report->date_from->toDateString();
            $to = $report->date_to->toDateString();
        }

        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();

        $payload = $this->buildReportPayload($reportType, $fromDate, $toDate, $costing);
        $transactions = $this->buildReportTransactions($reportType, $fromDate, $toDate);

        $record = AccountingReport::create([
            'report_type' => $reportType,
            'date_from' => $fromDate->toDateString(),
            'date_to' => $toDate->toDateString(),
            'total_sales' => $payload['total_sales'] ?? null,
            'total_net_sales' => $payload['total_net_sales'] ?? null,
            'total_vat' => $payload['total_vat'] ?? null,
            'total_cash' => $payload['total_cash'] ?? null,
            'total_non_cash' => $payload['total_non_cash'] ?? null,
            'total_remitted' => $payload['total_remitted'] ?? null,
            'variance_total' => $payload['variance_total'] ?? null,
            'generated_at' => now(),
            'generated_by_user_id' => $request->user()?->id,
        ]);

        $filenameBase = "{$reportType}_{$fromDate->toDateString()}_{$toDate->toDateString()}";

        if ($format === 'pdf') {
            $html = view('exports.accountant.report', [
                'reportType' => $reportType,
                'from' => $fromDate,
                'to' => $toDate,
                'payload' => $payload,
                'transactions' => $transactions,
            ])->render();

            return Pdf::loadHTML($html)
                ->setPaper('a4', 'portrait')
                ->download("{$filenameBase}.pdf");
        }

        if ($format === 'xlsx') {
            return Excel::download(
                new AccountingReportExport($reportType, $fromDate, $toDate, $payload, $transactions),
                "{$filenameBase}.xlsx"
            );
        }

        $csv = $this->payloadToCsv($reportType, $fromDate, $toDate, $payload, $transactions);
        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filenameBase}.csv\"",
        ]);
    }

    protected function buildReportPayload(string $type, Carbon $from, Carbon $to, CostingService $costing): array
    {
        if ($type === 'sales') {
            $salesQuery = Sale::query()
                ->where('status', 'paid')
                ->whereBetween('sale_datetime', [$from, $to]);

            $salesTotal = (float) (clone $salesQuery)->sum('grand_total');
            $netTotal = (float) (clone $salesQuery)->sum('net_amount');
            $vatTotal = (float) (clone $salesQuery)->sum('vat_amount');

            $payments = DB::table('payments as p')
                ->join('payment_methods as pm', 'pm.id', '=', 'p.payment_method_id')
                ->join('sales as s', 's.id', '=', 'p.sale_id')
                ->whereBetween('s.sale_datetime', [$from, $to])
                ->selectRaw('SUM(CASE WHEN pm.method_key = "cash" THEN p.amount ELSE 0 END) as cash_total,
                            SUM(CASE WHEN pm.method_key <> "cash" THEN p.amount ELSE 0 END) as non_cash_total')
                ->first();

            $cogs = 0.0;
            $saleItems = DB::table('sale_items as si')
                ->join('sales as s', 's.id', '=', 'si.sale_id')
                ->whereBetween('s.sale_datetime', [$from, $to])
                ->select('si.product_variant_id', 'si.qty', 's.sale_datetime')
                ->get();

            foreach ($saleItems as $item) {
                $avgCost = $costing->getWeightedAverageCost((int) $item->product_variant_id, Carbon::parse($item->sale_datetime));
                $cogs += ((float) $item->qty) * $avgCost;
            }

            $inventoryValue = $this->inventoryValuationAsOf($to, $costing);

            return [
                'total_sales' => $salesTotal,
                'total_net_sales' => $netTotal,
                'total_vat' => $vatTotal,
                'total_cash' => (float) ($payments->cash_total ?? 0),
                'total_non_cash' => (float) ($payments->non_cash_total ?? 0),
                'cogs' => $cogs,
                'gross_profit' => (float) $salesTotal - $cogs,
                'inventory_valuation' => $inventoryValue,
            ];
        }

        if ($type === 'remittances') {
            $remitted = Remittance::whereBetween('business_date', [$from->toDateString(), $to->toDateString()])
                ->sum('remitted_amount');
            $variance = Remittance::whereBetween('business_date', [$from->toDateString(), $to->toDateString()])
                ->sum('variance_amount');

            return [
                'total_remitted' => (float) $remitted,
                'variance_total' => (float) $variance,
            ];
        }

        $variance = Remittance::whereBetween('business_date', [$from->toDateString(), $to->toDateString()])
            ->sum('variance_amount');

        return [
            'variance_total' => (float) $variance,
        ];
    }

    protected function inventoryValuationAsOf(Carbon $asOf, CostingService $costing): float
    {
        $rows = DB::table('stock_movements')
            ->whereDate('moved_at', '<=', $asOf->toDateString())
            ->selectRaw('product_variant_id, SUM(qty) as on_hand')
            ->groupBy('product_variant_id')
            ->get();

        $value = 0.0;
        foreach ($rows as $row) {
            $onHand = (float) $row->on_hand;
            if ($onHand <= 0) {
                continue;
            }
            $avgCost = $costing->getWeightedAverageCost((int) $row->product_variant_id, $asOf);
            $value += $onHand * $avgCost;
        }

        return $value;
    }

    protected function payloadToCsv(string $type, Carbon $from, Carbon $to, array $payload, array $transactions): string
    {
        $lines = [];
        $lines[] = "report_type,from,to";
        $lines[] = "{$type},{$from->toDateString()},{$to->toDateString()}";
        $lines[] = "";

        if ($type === 'sales') {
            $lines[] = "total_sales,total_net_sales,total_vat,total_cash,total_non_cash,cogs,gross_profit,inventory_valuation";
            $lines[] = implode(',', [
                $payload['total_sales'] ?? 0,
                $payload['total_net_sales'] ?? 0,
                $payload['total_vat'] ?? 0,
                $payload['total_cash'] ?? 0,
                $payload['total_non_cash'] ?? 0,
                $payload['cogs'] ?? 0,
                $payload['gross_profit'] ?? 0,
                $payload['inventory_valuation'] ?? 0,
            ]);
            if (!empty($transactions)) {
                $lines[] = "";
                $lines[] = "sale_number,sale_datetime,customer,cashier,items_count,items_qty,cash_amount,non_cash_amount,net_amount,vat_amount,gross_amount";
                foreach ($transactions as $row) {
                    $lines[] = implode(',', [
                        $row['reference'] ?? '',
                        $row['sale_datetime'] ?? '',
                        $this->escapeCsvValue($row['customer'] ?? ''),
                        $this->escapeCsvValue($row['cashier'] ?? ''),
                        $row['items_count'] ?? 0,
                        $row['items_qty'] ?? 0,
                        $row['cash_amount'] ?? 0,
                        $row['non_cash_amount'] ?? 0,
                        $row['net_amount'] ?? 0,
                        $row['vat_amount'] ?? 0,
                        $row['gross_amount'] ?? 0,
                    ]);
                }
            }

            return implode("\n", $lines);
        }

        if ($type === 'remittances') {
            $lines[] = "total_remitted,variance_total";
            $lines[] = implode(',', [
                $payload['total_remitted'] ?? 0,
                $payload['variance_total'] ?? 0,
            ]);
            if (!empty($transactions)) {
                $lines[] = "";
                $lines[] = "business_date,cashier,expected_amount,expected_cash,expected_noncash_total,remitted_amount,variance_amount,status,recorded_at,accountant";
                foreach ($transactions as $row) {
                    $lines[] = implode(',', [
                        $row['business_date'] ?? '',
                        $this->escapeCsvValue($row['cashier'] ?? ''),
                        $row['expected_amount'] ?? 0,
                        $row['expected_cash'] ?? 0,
                        $row['expected_noncash_total'] ?? 0,
                        $row['remitted_amount'] ?? 0,
                        $row['variance_amount'] ?? 0,
                        $this->escapeCsvValue($row['status'] ?? ''),
                        $row['recorded_at'] ?? '',
                        $this->escapeCsvValue($row['accountant'] ?? ''),
                    ]);
                }
            }

            return implode("\n", $lines);
        }

        $lines[] = "variance_total";
        $lines[] = (string) ($payload['variance_total'] ?? 0);
        if (!empty($transactions)) {
            $lines[] = "";
            $lines[] = "business_date,cashier,expected_amount,expected_cash,expected_noncash_total,remitted_amount,variance_amount,status,recorded_at,accountant";
            foreach ($transactions as $row) {
                $lines[] = implode(',', [
                    $row['business_date'] ?? '',
                    $this->escapeCsvValue($row['cashier'] ?? ''),
                    $row['expected_amount'] ?? 0,
                    $row['expected_cash'] ?? 0,
                    $row['expected_noncash_total'] ?? 0,
                    $row['remitted_amount'] ?? 0,
                    $row['variance_amount'] ?? 0,
                    $this->escapeCsvValue($row['status'] ?? ''),
                    $row['recorded_at'] ?? '',
                    $this->escapeCsvValue($row['accountant'] ?? ''),
                ]);
            }
        }
        return implode("\n", $lines);
    }

    protected function buildReportTransactions(string $type, Carbon $from, Carbon $to): array
    {
        if ($type === 'sales') {
            $sales = Sale::query()
                ->with(['customer', 'cashier', 'payments.paymentMethod'])
                ->withCount('items')
                ->withSum('items as items_qty', 'qty')
                ->where('status', 'paid')
                ->whereBetween('sale_datetime', [$from, $to])
                ->orderByDesc('sale_datetime')
                ->get();

            return $sales->map(function ($sale) {
                $payments = $sale->payments ?? collect();
                $cashAmount = $payments->filter(function ($payment) {
                    return $payment->paymentMethod?->method_key === 'cash';
                })->sum('amount');
                $totalPaid = $payments->sum('amount');
                $nonCashAmount = $totalPaid - $cashAmount;

                return [
                    'transaction_type' => 'sale',
                    'reference' => $sale->sale_number,
                    'sale_datetime' => optional($sale->sale_datetime)->format('Y-m-d H:i:s'),
                    'customer' => $sale->customer?->name ?? 'Walk in',
                    'cashier' => $sale->cashier?->name ?? 'System',
                    'items_count' => (int) ($sale->items_count ?? 0),
                    'items_qty' => (int) ($sale->items_qty ?? 0),
                    'cash_amount' => (float) $cashAmount,
                    'non_cash_amount' => (float) $nonCashAmount,
                    'net_amount' => (float) ($sale->net_amount ?? 0),
                    'vat_amount' => (float) ($sale->vat_amount ?? 0),
                    'gross_amount' => (float) ($sale->grand_total ?? $sale->gross_amount ?? 0),
                ];
            })->toArray();
        }

        $remittances = Remittance::query()
            ->with(['cashier', 'accountant'])
            ->whereBetween('business_date', [$from->toDateString(), $to->toDateString()]);

        if ($type === 'discrepancies') {
            $remittances->where('variance_amount', '!=', 0);
        }

        return $remittances
            ->orderByDesc('business_date')
            ->get()
            ->map(function ($remittance) {
                return [
                    'transaction_type' => 'remittance',
                    'business_date' => optional($remittance->business_date)->toDateString(),
                    'cashier' => $remittance->cashier?->name ?? 'System',
                    'expected_amount' => (float) ($remittance->expected_amount ?? 0),
                    'expected_cash' => (float) ($remittance->expected_cash ?? 0),
                    'expected_noncash_total' => (float) ($remittance->expected_noncash_total ?? 0),
                    'remitted_amount' => (float) ($remittance->remitted_amount ?? 0),
                    'variance_amount' => (float) ($remittance->variance_amount ?? 0),
                    'status' => $remittance->status ?? 'pending',
                    'recorded_at' => optional($remittance->recorded_at)->format('Y-m-d H:i:s'),
                    'accountant' => $remittance->accountant?->name ?? 'System',
                ];
            })
            ->toArray();
    }

    protected function escapeCsvValue(string $value): string
    {
        $clean = str_replace('"', '""', $value);
        if (str_contains($clean, ',') || str_contains($clean, '"') || str_contains($clean, "\n")) {
            return "\"{$clean}\"";
        }
        return $clean;
    }
}
