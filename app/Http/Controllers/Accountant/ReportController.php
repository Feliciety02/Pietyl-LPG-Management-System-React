<?php

namespace App\Http\Controllers\Accountant;

use App\Http\Controllers\Controller;
use App\Models\AccountingReport;
use App\Models\Remittance;
use App\Models\Sale;
use App\Services\Accounting\CostingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        ]);
    }

    public function export(Request $request, CostingService $costing)
    {
        $format = strtolower($request->input('format', 'csv'));
        if ($format !== 'csv') {
            return back()->with('error', 'Only CSV export is supported right now.');
        }

        $reportType = $request->input('type');
        $from = $request->input('from');
        $to = $request->input('to');

        if ($request->filled('id')) {
            $report = AccountingReport::findOrFail($request->input('id'));
            $reportType = $report->report_type;
            $from = $report->date_from->toDateString();
            $to = $report->date_to->toDateString();
        }

        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();

        $payload = $this->buildReportPayload($reportType, $fromDate, $toDate, $costing);

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

        $csv = $this->payloadToCsv($reportType, $fromDate, $toDate, $payload);
        $filename = "{$reportType}_{$fromDate->toDateString()}_{$toDate->toDateString()}.csv";

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
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

    protected function payloadToCsv(string $type, Carbon $from, Carbon $to, array $payload): string
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
            return implode("\n", $lines);
        }

        if ($type === 'remittances') {
            $lines[] = "total_remitted,variance_total";
            $lines[] = implode(',', [
                $payload['total_remitted'] ?? 0,
                $payload['variance_total'] ?? 0,
            ]);
            return implode("\n", $lines);
        }

        $lines[] = "variance_total";
        $lines[] = (string) ($payload['variance_total'] ?? 0);
        return implode("\n", $lines);
    }
}
