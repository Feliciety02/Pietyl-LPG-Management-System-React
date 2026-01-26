<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SaleController extends Controller
{
    public function index(Request $request)
    {

        
        $query = Sale::query()->with([
            'customer',
            'cashier',
            'items.productVariant.product',
            'payments.paymentMethod'
        ]);

        // Search
        if ($search = $request->input('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('sale_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Status filter
        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Pagination
        $perPage = $request->input('per', 10);
        $salesPaginated = $query->latest('sale_datetime')
            ->paginate($perPage)
            ->withQueryString();

        // Transform data to match frontend structure
        $transformedData = $salesPaginated->map(function ($sale) {
            $payment = $sale->payments->first();
            
            return [
                'id' => $sale->id,
                'ref' => $sale->sale_number,
                'customer' => $sale->customer?->name ?? 'Walk in',
                'total' => $sale->grand_total,
                'method' => $payment?->paymentMethod?->method_key ?? 'cash',
                'status' => $sale->status,
                'created_at' => $sale->sale_datetime->format('M d, Y g:i A'),
                'lines' => $sale->items->map(function ($item) {
                    return [
                        'name' => $item->productVariant->product->name,
                        'variant' => $item->productVariant->variant_name,
                        'mode' => 'refill',
                        'qty' => $item->qty,
                        'unit_price' => $item->unit_price,
                    ];
                })->toArray(),
            ];
        });

        return Inertia::render('CashierPage/Sales', [
            'sales' => [
                'data' => $transformedData,
                'meta' => [
                    'current_page' => $salesPaginated->currentPage(),
                    'last_page' => $salesPaginated->lastPage(),
                    'from' => $salesPaginated->firstItem(),
                    'to' => $salesPaginated->lastItem(),
                    'total' => $salesPaginated->total(),
                    'per_page' => $salesPaginated->perPage(),
                ],
            ],
            'filters' => $request->only(['q', 'status', 'per']),
        ]);
    }
}