<?php

namespace App\Http\Controllers\Cashier;

use App\Exports\SalesReportExport;
use App\Http\Controllers\Controller;
use App\Models\Receipt as ReceiptModel;
use App\Models\Sale;
use App\Services\DailySummaryService;
use App\Services\SaleService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

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
        $summaryDate = $request->input("summary_date", now()->toDateString());

        $filters = [
            "q" => $request->input("q"),
            "status" => $request->input("status", "all"),
            "per" => $request->input("per", 10),
            "page" => $request->input("page", 1),
            "summary_date" => $summaryDate,
        ];

        $sales = $this->saleService->getSalesForPage($filters);
        $summaryPayload = $this->summaryService->getSummary($summaryDate);

        return Inertia::render("CashierPage/Sales", [
            "sales" => $sales,
            "filters" => $filters,
            "daily_summary" => $summaryPayload["summary"],
            "daily_summary_turnover" => $summaryPayload["cashier_turnover"],
        ]);
    }

    public function latest(Request $request)
    {
        $filters = [
            "q" => $request->input("q"),
            "status" => $request->input("status", "all"),
            "per" => $request->input("per", 10),
            "page" => $request->input("page", 1),
        ];

        return response()->json($this->saleService->getSalesForPage($filters));
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            "from_date" => ["required", "date"],
            "to_date" => ["required", "date", "after_or_equal:from_date"],
            "status_scope" => ["required", "in:paid,paid_pending,all"],
            "include_items" => ["sometimes", "boolean"],
        ]);

        $from = Carbon::parse($validated["from_date"])->startOfDay();
        $to = Carbon::parse($validated["to_date"])->endOfDay();
        $statusScope = $validated["status_scope"];
        $includeItems = filter_var($validated["include_items"] ?? false, FILTER_VALIDATE_BOOLEAN);

        $sales = $this->saleService->getSalesForExport([
            "from" => $from->toDateString(),
            "to" => $to->toDateString(),
            "status_scope" => $statusScope,
        ]);

        $summary = [
            "count" => $sales->count(),
            "total" => $sales->sum("grand_total"),
            "net_total" => $sales->sum("net_amount"),
            "vat_total" => $sales->sum("vat_amount"),
        ];

        $methodTotals = $sales
            ->flatMap(fn($sale) => $sale->payments->map(fn($payment) => [
                "method" => $payment->paymentMethod?->method_key ?? "cash",
                "amount" => $payment->amount,
            ]))
            ->groupBy("method")
            ->map(fn($items) => $items->sum("amount"))
            ->toArray();

        $statusLabels = [
            "paid" => "Paid only",
            "paid_pending" => "Paid + Pending",
            "all" => "All statuses",
        ];

        $fileName = sprintf(
            "Sales_%s_to_%s.xlsx",
            $from->format("Y-m-d"),
            $to->format("Y-m-d")
        );

        $rangeLabel = sprintf(
            "%s to %s",
            $from->format("M d, Y"),
            $to->format("M d, Y")
        );

        return Excel::download(
            new SalesReportExport(
                $sales,
                $methodTotals,
                $summary,
                $rangeLabel,
                $statusLabels[$statusScope] ?? "Paid only",
                $includeItems
            ),
            $fileName
        );
    }

    public function receipt(Sale $sale)
    {
        $sale->load(["items.productVariant.product", "payments.paymentMethod", "receipt", "customer"]);

        $saleDatetime = $sale->sale_datetime ? Carbon::parse($sale->sale_datetime) : null;
        $dateLabel = $saleDatetime ? $saleDatetime->format("M d, Y") : null;
        $timeLabel = $saleDatetime ? $saleDatetime->format("g:i A") : null;

        $payment = $sale->payments->first();

        $payload = [
            "id" => $sale->id,
            "ref" => $sale->receipt?->receipt_number ?? $sale->sale_number,
            "date" => $dateLabel,
            "time" => $timeLabel,
            "date_label" => $dateLabel,
            "time_label" => $timeLabel,
            "lines" => $sale->items->map(function ($item) {
                return [
                    "name" => $item->productVariant?->product?->name ?? $item->product_name ?? "Item",
                    "variant" => $item->productVariant?->variant_name ?? null,
                    "qty" => $item->qty,
                    "unit_price" => $item->unit_price,
                ];
            })->toArray(),
            "net_amount" => $sale->net_amount,
            "vat_amount" => $sale->vat_amount,
            "gross_amount" => $sale->gross_amount ?? $sale->grand_total,
            "vat_treatment" => $sale->vat_treatment,
            "vat_inclusive" => $sale->vat_inclusive,
            "method" => $payment?->paymentMethod?->method_key ?? "cash",
            "amount_received" => $sale->cash_tendered,
            "change" => $sale->cash_change,
            "company_phone" => config("app.company_phone") ?? null,
            "company_address" => config("app.company_address") ?? null,
            "company_tin" => config("app.company_tin") ?? null,
            "printed_count" => $sale->receipt?->printed_count ?? 0,
        ];

        return response()->json($payload);
    }

    public function reprint(Sale $sale)
    {
        try {
            $receipt = ReceiptModel::where("sale_id", $sale->id)->first();

            if (!$receipt) {
                try {
                    $receipt = ReceiptModel::create([
                        "sale_id" => $sale->id,
                        "receipt_number" => ReceiptModel::generateReceiptNumber(),
                        "printed_count" => 0,
                        "issued_at" => now(),
                    ]);
                } catch (\Throwable $e) {
                    Log::error("Failed to create receipt via Eloquent", [
                        "sale_id" => $sale->id,
                        "error" => $e->getMessage(),
                    ]);

                    try {
                        DB::table("receipts")->insert([
                            "sale_id" => $sale->id,
                            "receipt_number" => ReceiptModel::generateReceiptNumber(),
                            "printed_count" => 0,
                            "issued_at" => now()->toDateTimeString(),
                            "created_at" => now()->toDateTimeString(),
                            "updated_at" => now()->toDateTimeString(),
                        ]);
                        $receipt = ReceiptModel::where("sale_id", $sale->id)->first();
                    } catch (\Throwable $e2) {
                        Log::error("Failed to create receipt via raw insert", [
                            "sale_id" => $sale->id,
                            "error" => $e2->getMessage(),
                        ]);
                    }
                }
            }

            if ($receipt) {
                try {
                    $receipt->increment("printed_count");
                } catch (\Throwable $e) {
                    Log::error("Failed to increment printed_count", [
                        "receipt_id" => $receipt->id,
                        "error" => $e->getMessage(),
                    ]);
                }
            }

            $sale->load("receipt");
            return $this->receipt($sale);
        } catch (\Throwable $e) {
            Log::error("Reprint method error", [
                "sale_id" => $sale->id ?? null,
                "error" => $e->getMessage(),
                "trace" => $e->getTraceAsString(),
            ]);

            return response()->json([
                "error" => "Failed to reprint receipt",
                "message" => $e->getMessage(),
            ], 500);
        }
    }

    public function printReceipt(Sale $sale)
    {
        $sale->load(["items.productVariant.product", "payments.paymentMethod", "receipt", "customer"]);

        $saleDatetime = $sale->sale_datetime ? Carbon::parse($sale->sale_datetime) : null;
        $dateLabel = $saleDatetime ? $saleDatetime->format("M d, Y") : null;
        $timeLabel = $saleDatetime ? $saleDatetime->format("g:i A") : null;

        $payment = $sale->payments->first();

        $payload = [
            "id" => $sale->id,
            "ref" => $sale->receipt?->receipt_number ?? $sale->sale_number,
            "date" => $dateLabel,
            "time" => $timeLabel,
            "date_label" => $dateLabel,
            "time_label" => $timeLabel,
            "lines" => $sale->items->map(function ($item) {
                return [
                    "name" => $item->productVariant?->product?->name ?? $item->product_name ?? "Item",
                    "variant" => $item->productVariant?->variant_name ?? null,
                    "qty" => $item->qty,
                    "unit_price" => $item->unit_price,
                ];
            })->toArray(),
            "net_amount" => $sale->net_amount,
            "vat_amount" => $sale->vat_amount,
            "gross_amount" => $sale->gross_amount ?? $sale->grand_total,
            "vat_treatment" => $sale->vat_treatment,
            "vat_inclusive" => $sale->vat_inclusive,
            "method" => $payment?->paymentMethod?->method_key ?? "cash",
            "amount_received" => $sale->cash_tendered,
            "change" => $sale->cash_change,
            "company_phone" => config("app.company_phone") ?? null,
            "company_address" => config("app.company_address") ?? null,
            "company_tin" => config("app.company_tin") ?? null,
        ];

        $format = request()->query("format");

        if (strtolower((string) $format) === "pdf" && class_exists(Pdf::class)) {
            try {
                $pdf = Pdf::loadView("receipts.print", ["sale" => $payload]);
                $fileName = sprintf("Receipt_%s.pdf", $payload["ref"] ?? $sale->id);
                return $pdf->download($fileName);
            } catch (\Throwable $e) {
                Log::error("Failed to generate PDF for receipt", [
                    "sale_id" => $sale->id,
                    "error" => $e->getMessage(),
                ]);
            }
        }

        return view("receipts.print", ["sale" => $payload]);
    }
}
