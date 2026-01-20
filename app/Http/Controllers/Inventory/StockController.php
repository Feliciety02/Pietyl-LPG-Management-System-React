<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use Inertia\Inertia;

class StockController extends Controller
{
    public function index()
    {
        // Load all stocks with their related product
        $stocks = Stock::with('product')->get()->map(function ($stock) {
            return [
                'id' => $stock->id,
                'sku' => $stock->product->sku ?? null,
                'product_name' => $stock->product->name ?? null,
                'variant' => $stock->product->variant ?? null,
                'filled_qty' => $stock->filled_qty,
                'empty_qty' => $stock->empty_qty,
                'total_qty' => $stock->total_qty,
                'last_counted_at' => $stock->last_counted_at?->format('M d Y h:i A') ?? null,
                'updated_by' => $stock->updated_by,
            ];
        });

        return Inertia::render('InventoryPage/StockCounts', [
            'stock_counts' => [
                'data' => $stocks,
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'from' => 1,
                    'to' => $stocks->count(),
                    'total' => $stocks->count(),
                ],
            ],
        ]);
    }
}
