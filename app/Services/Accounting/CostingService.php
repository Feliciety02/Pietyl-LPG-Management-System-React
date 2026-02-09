<?php

namespace App\Services\Accounting;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CostingService
{
    public function getWeightedAverageCost(int $variantId, Carbon $asOfDate): float
    {
        $row = DB::table('product_variants as pv')
            ->join('products as p', 'pv.product_id', '=', 'p.id')
            ->where('pv.id', $variantId)
            ->select('p.supplier_cost')
            ->first();

        return (float) ($row->supplier_cost ?? 0.0);
    }
}
