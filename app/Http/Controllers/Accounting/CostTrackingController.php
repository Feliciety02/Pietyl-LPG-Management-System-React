<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use App\Models\Sale;
use App\Services\Accounting\CostingService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CostTrackingController extends Controller
{
    public function __construct(private CostingService $costing)
    {
    }

    public function index(Request $request)
    {
        $filters = $this->resolveFilters($request);
        $variantPayload = $this->buildVariantRows($filters);

        return Inertia::render("AdminPage/CostTracking", [
            "filters" => [
                "preset" => $filters["preset"],
                "from" => $filters["from_input"],
                "to" => $filters["to_input"],
                "per" => $filters["per"],
                "page" => $filters["page"],
                "sort_by" => $filters["sort_by"],
                "sort_dir" => $filters["sort_dir"],
            ],
            "summary" => $this->buildSummary($filters),
            "rows" => $variantPayload["data"],
            "meta" => $variantPayload["meta"],
            "sort" => $variantPayload["sort"],
            "trends" => $this->buildTrendSeries($filters),
            "path" => "/" . ltrim($request->path(), "/"),
        ]);
    }

    private function resolveFilters(Request $request): array
    {
        $preset = (string) $request->query("preset", "this_month");
        $fromInput = trim((string) $request->query("from", ""));
        $toInput = trim((string) $request->query("to", ""));
        $per = max(5, min(50, (int) $request->query("per", 15)));
        $page = max(1, (int) $request->query("page", 1));
        $sortBy = (string) $request->query("sort_by", "qty_on_hand");
        $sortDir = strtolower((string) $request->query("sort_dir", "desc")) === "asc" ? "asc" : "desc";

        return $this->resolveRange($preset, $fromInput, $toInput) + [
            "per" => $per,
            "page" => $page,
            "sort_by" => $sortBy,
            "sort_dir" => $sortDir,
        ];
    }

    private function resolveRange(string $preset, string $fromInput, string $toInput): array
    {
        $now = Carbon::now();
        $preset = $preset ?: "this_month";

        $from = $now->copy()->startOfDay();
        $to = $now->copy()->endOfDay();
        $fromDisplay = "";
        $toDisplay = "";

        switch ($preset) {
            case "last_7":
                $to = $now->copy()->endOfDay();
                $from = $now->copy()->subDays(6)->startOfDay();
                break;
            case "last_30":
                $to = $now->copy()->endOfDay();
                $from = $now->copy()->subDays(29)->startOfDay();
                break;
            case "this_month":
                $from = $now->copy()->startOfMonth();
                $to = $now->copy()->endOfMonth();
                break;
            case "custom":
                $preset = "custom";
                $fromDisplay = $fromInput;
                $toDisplay = $toInput;

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
                $preset = "this_month";
                $from = $now->copy()->startOfMonth();
                $to = $now->copy()->endOfMonth();
                break;
        }

        return [
            "preset" => $preset,
            "from_input" => $fromDisplay,
            "to_input" => $toDisplay,
            "from" => $from,
            "to" => $to,
        ];
    }

    private function buildSummary(array $filters): array
    {
        $salesQuery = Sale::query()
            ->where("status", "paid")
            ->whereBetween("sale_datetime", [$filters["from"], $filters["to"]]);

        $salesTotal = (float) $salesQuery->sum("grand_total");
        $cogs = $this->calculateCostOfGoodsSold($filters["from"], $filters["to"]);
        $inventoryValue = $this->inventoryValueFromBalances();
        $grossProfit = $salesTotal - $cogs;

        return [
            "sales_total" => $salesTotal,
            "cogs" => round($cogs, 2),
            "inventory_value" => round($inventoryValue, 2),
            "gross_profit" => round($grossProfit, 2),
        ];
    }

    private function buildVariantRows(array $filters): array
    {
        $perPage = max(5, min(50, (int) ($filters["per"] ?? 15)));
        $page = max(1, (int) ($filters["page"] ?? 1));
        $sortBy = $filters["sort_by"] ?? "qty_on_hand";
        $sortDir = $filters["sort_dir"] ?? "desc";

        $sortMap = [
            "product" => "p.name",
            "variant" => "pv.variant_name",
            "sku" => "p.sku",
            "type" => "p.category",
            "on_hand" => "qty_on_hand",
            "price" => "p.price",
            "supplier" => "s.name",
            "last_counted_at" => "last_counted_at",
        ];

        $sortColumn = $sortMap[$sortBy] ?? "qty_on_hand";

        $query = DB::table("inventory_balances as ib")
            ->join("product_variants as pv", "ib.product_variant_id", "=", "pv.id")
            ->join("products as p", "pv.product_id", "=", "p.id")
            ->leftJoin("suppliers as s", "p.supplier_id", "=", "s.id")
            ->selectRaw(
                "pv.id as variant_id,
                 p.name as product_name,
                 p.sku as sku,
                 pv.variant_name,
                 p.category as category,
                 p.price as price,
                 s.name as supplier_name,
                 p.supplier_cost as supplier_cost,
                 SUM(ib.qty_filled) as qty_on_hand,
                 MAX(ib.updated_at) as last_counted_at"
            )
            ->groupBy(
                "pv.id",
                "p.name",
                "p.sku",
                "pv.variant_name",
                "p.category",
                "p.price",
                "s.name",
                "p.supplier_cost"
            )
            ->havingRaw("SUM(ib.qty_filled) > 0")
            ->orderBy($sortColumn, $sortDir);

        $paginator = $query->paginate($perPage, ["*"], "page", $page);

        $rows = $paginator->getCollection()->map(function ($row) use ($filters) {
            $supplierCost = (float) ($row->supplier_cost ?? 0);
            $value = ((float) $row->qty_on_hand) * $supplierCost;

            return [
                "id" => $row->variant_id,
                "product_name" => $row->product_name,
                "variant_name" => $row->variant_name,
                "sku" => $row->sku,
                "type" => $row->category,
                "supplier_name" => $row->supplier_name,
                "price" => round((float) ($row->price ?? 0), 2),
                "on_hand" => (float) $row->qty_on_hand,
                "unit_cost" => round($supplierCost, 2),
                "supplier_cost" => round($supplierCost, 2),
                "value" => round($value, 2),
                "last_counted_at" => $row->last_counted_at ? Carbon::parse($row->last_counted_at)->format("M d, Y h:i A") : null,
            ];
        })->values()->all();

        return [
            "data" => $rows,
            "meta" => [
                "current_page" => $paginator->currentPage(),
                "last_page" => $paginator->lastPage(),
                "from" => $paginator->firstItem(),
                "to" => $paginator->lastItem(),
                "per_page" => $paginator->perPage(),
                "total" => $paginator->total(),
            ],
            "sort" => [
                "key" => $sortBy,
                "dir" => $sortDir,
            ],
        ];
    }

    private function calculateCostOfGoodsSold(Carbon $from, Carbon $to): float
    {
        $items = DB::table("sale_items as si")
            ->join("sales as s", "s.id", "=", "si.sale_id")
            ->whereBetween("s.sale_datetime", [$from, $to])
            ->select("si.product_variant_id", "si.qty", "s.sale_datetime")
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
        $rows = DB::table("stock_movements")
            ->whereDate("moved_at", "<=", $asOf->toDateString())
            ->selectRaw("product_variant_id, SUM(qty) as on_hand")
            ->groupBy("product_variant_id")
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

    private function buildTrendSeries(array $filters): array
    {
        $from = $filters["from"]->copy()->startOfDay();
        $to = $filters["to"]->copy()->endOfDay();

        $records = PurchaseRequest::query()
            ->whereNotNull("requested_at")
            ->whereBetween("requested_at", [$from, $to])
            ->selectRaw("DATE(requested_at) as day, COUNT(*) as volume, COALESCE(SUM(total_estimated_cost), 0) as cost")
            ->groupBy("day")
            ->orderBy("day")
            ->get()
            ->keyBy("day");

        $period = CarbonPeriod::create($from, $to);
        $series = [];

        foreach ($period as $day) {
            $key = $day->toDateString();
            $record = $records->get($key);

            $series[] = [
                "label" => $day->format("M d"),
                "date" => $key,
                "requests" => (int) ($record->volume ?? 0),
                "cost" => round((float) ($record->cost ?? 0), 2),
            ];
        }

        return [
            "series" => $series,
            "range" => [
                "start" => $from->toDateString(),
                "end" => $to->toDateString(),
            ],
        ];
    }

    private function inventoryValueFromBalances(): float
    {
        $value = DB::table("inventory_balances as ib")
            ->join("product_variants as pv", "ib.product_variant_id", "=", "pv.id")
            ->join("products as p", "pv.product_id", "=", "p.id")
            ->selectRaw("SUM((ib.qty_filled) * COALESCE(p.supplier_cost, 0)) as inventory_value")
            ->whereRaw("(ib.qty_filled) > 0")
            ->value("inventory_value");

        return round((float) ($value ?? 0), 2);
    }
}
