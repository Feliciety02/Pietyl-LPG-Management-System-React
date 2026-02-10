<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Remittance;
use App\Models\Sale;
use App\Services\Accounting\CostingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportsController extends Controller
{
    public function __construct(private CostingService $costing)
    {
    }

    public function index(Request $request)
    {
        $filters = $this->resolveFilters($request);
        $report = $this->buildReport($filters['from'], $filters['to']);

        return Inertia::render('AdminPage/Reports', [
            'report' => $report,
            'filters' => [
                'preset' => $filters['preset'],
                'from' => $filters['from_input'],
                'to' => $filters['to_input'],
            ],
        ]);
    }

    public function export(Request $request)
    {
        $filters = $this->resolveFilters($request);
        $report = $this->buildReport($filters['from'], $filters['to']);

        $filename = sprintf(
            'admin-report-%s-to-%s.csv',
            $filters['from']->format('Ymd'),
            $filters['to']->format('Ymd')
        );

        return response()->streamDownload(function () use ($report) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Metric', 'Value']);

            foreach ($this->reportRowsForExport($report) as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function resolveFilters(Request $request): array
    {
        $preset = (string) $request->query('preset', 'today');
        $fromInput = trim((string) $request->query('from', ''));
        $toInput = trim((string) $request->query('to', ''));

        $range = $this->resolveRange($preset, $fromInput, $toInput);

        return [
            'preset' => $range['preset'],
            'from_input' => $range['from_input'],
            'to_input' => $range['to_input'],
            'from' => $range['from'],
            'to' => $range['to'],
        ];
    }

    private function resolveRange(string $preset, string $fromInput, string $toInput): array
    {
        $now = Carbon::now();
        $preset = $preset ?: 'today';

        $from = $now->copy()->startOfDay();
        $to = $now->copy()->endOfDay();
        $displayFrom = '';
        $displayTo = '';

        switch ($preset) {
            case 'this_week':
                $from = $now->copy()->startOfWeek();
                $to = $now->copy()->endOfWeek();
                break;

            case 'this_month':
                $from = $now->copy()->startOfMonth();
                $to = $now->copy()->endOfMonth();
                break;

            case 'custom':
                $displayFrom = $fromInput;
                $displayTo = $toInput;

                if ($fromInput) {
                    try {
                        $from = Carbon::parse($fromInput)->startOfDay();
                    } catch (\Throwable) {
                        $from = $now->copy()->startOfDay();
                    }
                }

                if ($toInput) {
                    try {
                        $to = Carbon::parse($toInput)->endOfDay();
                    } catch (\Throwable) {
                        $to = $now->copy()->endOfDay();
                    }
                }
                break;

            default:
                $preset = 'today';
                break;
        }

        return [
            'preset' => $preset,
            'from_input' => $displayFrom,
            'to_input' => $displayTo,
            'from' => $from,
            'to' => $to,
        ];
    }

    private function buildReport(Carbon $from, Carbon $to): array
    {
        $salesBase = Sale::query()
            ->where('status', 'paid')
            ->whereBetween('sale_datetime', [$from, $to]);

        $deliveriesBase = Delivery::query()
            ->whereBetween('created_at', [$from, $to]);

        $salesTotal = (float) $salesBase->sum('grand_total');
        $salesCount = (int) $salesBase->count();

        $deliveriesTotal = (int) $deliveriesBase->count();

        $deliveriesCompleted = (int) Delivery::query()
            ->where('status', Delivery::STATUS_DELIVERED)
            ->whereBetween('delivered_at', [$from, $to])
            ->count();

        $remittanceTotal = (float) Remittance::query()
            ->whereNotNull('remitted_amount')
            ->whereBetween('recorded_at', [$from, $to])
            ->sum('remitted_amount');

        $inventoryRisk = $this->buildInventoryRisk();
        $cogs = $this->calculateCostOfGoodsSold($from, $to);
        $inventoryValue = $this->inventoryValuationAsOf($to);
        $grossProfit = $salesTotal - $cogs;

        return [
            'sales_total' => $this->formatCurrency($salesTotal),
            'sales_total_raw' => $salesTotal,

            'sales_count' => (string) $salesCount,

            'revenue_total' => $this->formatCurrency($salesTotal),
            'revenue_total_raw' => $salesTotal,

            'deliveries_total' => (string) $deliveriesTotal,
            'deliveries_completed' => (string) $deliveriesCompleted,

            'remittance_total' => $this->formatCurrency($remittanceTotal),
            'remittance_total_raw' => $remittanceTotal,

            'low_stock_count' => (string) $inventoryRisk['count'],
            'inventory_risk' => $inventoryRisk['records'],

            'cogs' => $this->formatCurrency($cogs),
            'gross_profit' => $this->formatCurrency($grossProfit),
            'inventory_valuation' => $this->formatCurrency($inventoryValue),

            'top_products' => [],
            'top_customers' => [],
            'rider_perf' => [],
        ];
    }

    private function buildInventoryRisk(): array
    {
        $baseQuery = DB::table('inventory_balances as ib')
            ->join('product_variants as pv', 'pv.id', '=', 'ib.product_variant_id')
            ->join('products as p', 'p.id', '=', 'pv.product_id')
            ->select(
                'ib.product_variant_id',
                'pv.variant_name',
                'p.name as product_name',
                DB::raw('SUM(ib.qty_filled) as qty_on_hand'),
                DB::raw('MAX(ib.reorder_level) as threshold')
            )
            ->groupBy('ib.product_variant_id', 'pv.variant_name', 'p.name')
            ->havingRaw('SUM(ib.qty_filled) <= MAX(ib.reorder_level)');

        $count = (int) (clone $baseQuery)->count();

        $records = (clone $baseQuery)
            ->orderBy('qty_on_hand', 'asc')
            ->limit(6)
            ->get()
            ->map(function ($row) {
                $product = (string) ($row->product_name ?? 'Product');
                $variant = (string) ($row->variant_name ?? 'Variant');

                return [
                    'name' => trim($product . ' · ' . $variant),
                    'qty' => (int) $row->qty_on_hand,
                    'threshold' => (int) $row->threshold,
                ];
            })
            ->values()
            ->all();

        return [
            'count' => $count,
            'records' => $records,
        ];
    }

    private function calculateCostOfGoodsSold(Carbon $from, Carbon $to): float
    {
        $items = DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->whereBetween('s.sale_datetime', [$from, $to])
            ->select('si.product_variant_id', 'si.qty', 's.sale_datetime')
            ->get();

        $cogs = 0.0;
        foreach ($items as $item) {
            $avgCost = $this->costing->getWeightedAverageCost(
                (int) $item->product_variant_id,
                Carbon::parse($item->sale_datetime)
            );

            $cogs += ((float) $item->qty) * $avgCost;
        }

        return $cogs;
    }

    private function inventoryValuationAsOf(Carbon $asOf): float
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

            $avgCost = $this->costing->getWeightedAverageCost(
                (int) $row->product_variant_id,
                $asOf
            );

            $value += $onHand * $avgCost;
        }

        return $value;
    }

    private function formatCurrency(float $value): string
    {
        return '₱' . number_format($value, 2, '.', ',');
    }

    private function reportRowsForExport(array $report): array
    {
        return [
            ['Sales total', $report['sales_total'] ?? '₱0.00'],
            ['Sales count', $report['sales_count'] ?? '0'],
            ['Revenue total', $report['revenue_total'] ?? '₱0.00'],
            ['COGS', $report['cogs'] ?? '₱0.00'],
            ['Gross profit', $report['gross_profit'] ?? '₱0.00'],
            ['Inventory valuation', $report['inventory_valuation'] ?? '₱0.00'],
            ['Deliveries total', $report['deliveries_total'] ?? '0'],
            ['Deliveries completed', $report['deliveries_completed'] ?? '0'],
            ['Low stock count', $report['low_stock_count'] ?? '0'],
            ['Remittance total', $report['remittance_total'] ?? '₱0.00'],
        ];
    }
}
