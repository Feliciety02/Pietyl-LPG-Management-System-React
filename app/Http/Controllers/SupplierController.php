<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\SupplierService;

class SupplierController extends Controller
{
    protected $svc;

    public function __construct(SupplierService $svc)
    {
        $this->svc = $svc;
    }

    public function index(Request $request)
    {
        $filters = [
            'q'      => $request->input('q', ''),
            'status' => $request->input('status', 'all'),
            'per'    => $request->input('per', 10),
            'page'   => $request->input('page', 1),
        ];

        $suppliers = $this->svc->getSuppliersForPage($filters);

        return Inertia::render('AdminPage/Suppliers', [
            'suppliers' => $suppliers,
            'filters'   => $filters,
        ]);
    }
}
