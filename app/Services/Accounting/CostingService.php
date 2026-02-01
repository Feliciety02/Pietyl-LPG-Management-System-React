<?php

namespace App\Services\Accounting;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CostingService
{
    public function getWeightedAverageCost(int $variantId, Carbon $asOfDate): float
    {
        $row = DB::table('purchase_items as pi')
            ->join('purchases as p', 'p.id', '=', 'pi.purchase_id')
            ->where('pi.product_variant_id', $variantId)
            ->whereNotNull('p.received_at')
            ->whereDate('p.received_at', '<=', $asOfDate->toDateString())
            ->selectRaw(
                'SUM(COALESCE(NULLIF(pi.received_qty, 0), pi.qty) * pi.unit_cost) as total_cost,
                 SUM(COALESCE(NULLIF(pi.received_qty, 0), pi.qty)) as total_qty'
            )
            ->first();

        $totalQty = (float) ($row->total_qty ?? 0);
        if ($totalQty <= 0) {
            $fallback = DB::table('purchase_items as pi')
                ->join('purchases as p', 'p.id', '=', 'pi.purchase_id')
                ->where('pi.product_variant_id', $variantId)
                ->orderByDesc('p.received_at')
                ->orderByDesc('p.id')
                ->value('pi.unit_cost');

            return (float) ($fallback ?? 0);
        }

        return (float) $row->total_cost / $totalQty;
    }
}
