<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    
    public function index(Request $request)
    {
        $query = Supplier::query();

        // Search
        if ($request->filled('q')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->q}%")
                  ->orWhere('email', 'like', "%{$request->q}%")
                  ->orWhere('phone', 'like', "%{$request->q}%");
            });
        }

        // Status filter
        if ($request->status && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        // Pagination
        $perPage = $request->get('per', 10);
        $suppliers = $query->withCount('supplierProducts')->latest()->paginate($perPage)->withQueryString();

        return Inertia::render('AdminPage/Suppliers', [
            'suppliers' => [
                'data' => collect($suppliers->items())->map(function ($s) {
                    return [
                        'id'             => $s->id,
                        'name'           => $s->name,
                        'contact_name'   => null, // WLA TAY CONTRACT DETAILS
                        'phone'          => $s->phone,
                        'email'          => $s->email,
                        'address'        => $s->address,
                        'is_active'      => $s->is_active,
                        'products_count' => $s->supplier_products_count ?? 0,
                    ];
                }),
                'meta' => [
                    'current_page' => $suppliers->currentPage(),
                    'last_page'    => $suppliers->lastPage(),
                    'per_page'     => $suppliers->perPage(),
                    'total'        => $suppliers->total(),
                    'from'         => $suppliers->firstItem(),
                    'to'           => $suppliers->lastItem(),
                ],
            ],
            'filters' => [
                'q'      => $request->q ?? '',
                'status' => $request->status ?? 'all',
                'page'   => $request->page ?? 1,
                'per'    => $perPage,
            ],
        ]);
    }

}