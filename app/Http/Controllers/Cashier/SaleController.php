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
<<<<<<< HEAD
        $user = $request->user();
        if (!$user || !$user->can('cashier.sales.view')) {
            abort(403);
        }

        $filters = $request->only(['q', 'status', 'per', 'page']);
        $sales = $this->svc->getSalesForPage($filters);
=======
        $filters = [
            'q' => $request->input('q'),
            'status' => $request->input('status', 'all'),
            'per' => $request->input('per', 10),
            'page' => $request->input('page', 1),
        ];
>>>>>>> 9760aed9e87ab0d5e5d79c164eb3d850f0401b6f

        $sales = $this->saleService->getSalesForPage($filters);
       
        return Inertia::render('CashierPage/Sales', [
            'sales' => $sales,
            'filters' => $filters,
        ]);
    }

    public function latest(Request $request)
    {
<<<<<<< HEAD
        $user = $request->user();
        if (!$user || !$user->can('cashier.sales.view')) {
            abort(403);
        }

        $filters = $request->only(['q', 'status', 'per', 'page']);
        $sales = $this->svc->getSalesForPage($filters);
=======
        $filters = [
            'q' => $request->input('q'),
            'status' => $request->input('status', 'all'),
            'per' => $request->input('per', 10),
            'page' => $request->input('page', 1),
        ];
>>>>>>> 9760aed9e87ab0d5e5d79c164eb3d850f0401b6f

        return response()->json($this->saleService->getSalesForPage($filters));
    }
}