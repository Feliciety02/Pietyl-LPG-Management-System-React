<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Services\SaleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SaleController extends Controller
{
    protected SaleService $saleService;

    public function __construct(SaleService $saleService)
    {
        $this->saleService = $saleService;
    }

    public function index(Request $request)
    {
        $filters = [
            'q' => $request->input('q'),
            'status' => $request->input('status', 'all'),
            'per' => $request->input('per', 10),
            'page' => $request->input('page', 1),
        ];

        $sales = $this->saleService->getSalesForPage($filters);

        return Inertia::render('CashierPage/Sales', [
            'sales' => $sales,
            'filters' => $filters,
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