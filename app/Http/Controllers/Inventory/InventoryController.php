<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Models\InventoryBalance;

class InventoryController
{
    public function getStockQuantities(Request $request)
    {
        $ids = collect(explode(',', $request->query('ids', '')))
            ->map('intval')
            ->filter()
            ->toArray();

        if (empty($ids)) {
            return response()->json([]);
        }

        $stocks = InventoryBalance::whereIn('id', $ids)
            ->get()
            ->mapWithKeys(function ($balance) {
                return [
                    $balance->id => [
                        'filled_qty' => (int) $balance->qty_filled,
                        'stock_qty' => (int) $balance->qty_filled,
                    ],
                ];
            });

        return response()->json($stocks);
    }
}
