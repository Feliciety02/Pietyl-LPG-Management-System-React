<?php

namespace App\Http\Controllers\Inventory;

use App\Console\Commands\StockServices;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\InventoryBalanceService;
use App\Models\InventoryBalance;
use Inertia\Inertia;

class StockController extends Controller
{
    
    public function stockCount(InventoryBalanceService $svc)
    {
        $data = $svc->MapDataForCountPage();

        return Inertia::render('InventoryPage/StockCounts', [
            'stock_counts' => [
                'data' => $data->items(),
                'meta' => [
                    'current_page' => $data->currentPage(),
                    'last_page' => $data->lastPage(),
                    'from' => $data->firstItem(),
                    'to' => $data->lastItem(),
                    'total' => $data->total(),
                ],
                'links' => $data->linkCollection(),
            ],
        ]);
    }

   
    public function update(Request $request, InventoryBalance $inventoryBalance, InventoryBalanceService $svc)
    {
        $svc->adjustStock($inventoryBalance, $request->validate([
            'filled_qty' => 'required|integer|min:0',
            'empty_qty' => 'required|integer|min:0',
            'reorder_level' => 'nullable|integer|min:0',
        ]));
        
   
        return back()->with('success', 'Stock adjusted successfully');
    }

    
    public function lowStock(InventoryBalanceService $svc)
    {
        $data = $svc->getLowStock();

        return Inertia::render('InventoryPage/LowStock', [
            'low_stock' => [
                'data' => $data['low_stock'],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'from' => 1,
                    'to' => count($data['low_stock']),
                    'total' => count($data['low_stock']),
                ],
            ],
            'product_hash' => $data['product_hash'],
            'suppliers' => $data['suppliers'],
        ]);
    }
}