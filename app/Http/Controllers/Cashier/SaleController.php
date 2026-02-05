<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Services\DailySummaryService;
use App\Services\SaleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
}
