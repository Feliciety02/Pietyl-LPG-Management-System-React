<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\SaleService;

class SaleController extends Controller
{
    protected SaleService $svc;

    public function __construct(SaleService $svc)
    {
        $this->svc = $svc;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('cashier.sales.view')) {
            abort(403);
        }

        $filters = $request->only(['q', 'status', 'per', 'page']);
        $sales = $this->svc->getSalesForPage($filters);

        return Inertia::render('CashierPage/Sales', [
            'sales' => $sales,
            'filters' => $filters,
        ]);
    }

    public function latest(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('cashier.sales.view')) {
            abort(403);
        }

        $filters = $request->only(['q', 'status', 'per', 'page']);
        $sales = $this->svc->getSalesForPage($filters);

        return response()->json($sales);
    }
}
