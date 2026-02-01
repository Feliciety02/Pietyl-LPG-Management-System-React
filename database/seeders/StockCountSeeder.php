<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StockCount;
use App\Models\InventoryBalance;
use App\Models\User;

class StockCountSeeder extends Seeder
{
    public function run(): void
    {
        $balances = InventoryBalance::with(['productVariant', 'location'])->get();
        if ($balances->isEmpty()) {
            return;
        }

        $submitter = User::whereHas('roles', fn ($q) => $q->where('name', 'inventory_manager'))->first()
            ?? User::first();
        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'admin'))->first()
            ?? User::first();

        foreach ($balances as $balance) {
            $systemFilled = (int) $balance->qty_filled;
            $systemEmpty = (int) $balance->qty_empty;

            $countedFilled = max(0, $systemFilled + rand(-2, 2));
            $countedEmpty = max(0, $systemEmpty + rand(-2, 2));

            $variance = ($countedFilled + $countedEmpty) - ($systemFilled + $systemEmpty);
            $status = $variance === 0 ? 'approved' : 'rejected';

            $reviewedBy = $status === 'submitted' ? null : $admin?->id;
            $reviewedAt = $status === 'submitted' ? null : now()->subDays(rand(0, 5));
            $reviewNote = $status === 'rejected' ? 'Counts do not match expected movement history.' : null;

            StockCount::create([
                'inventory_balance_id' => $balance->id,
                'product_variant_id' => $balance->product_variant_id,
                'location_id' => $balance->location_id,
                'system_filled' => $systemFilled,
                'system_empty' => $systemEmpty,
                'counted_filled' => $countedFilled,
                'counted_empty' => $countedEmpty,
                'variance_filled' => $countedFilled - $systemFilled,
                'variance_empty' => $countedEmpty - $systemEmpty,
                'status' => $status,
                'note' => 'Seeded count entry',
                'created_by_user_id' => $submitter?->id ?? 1,
                'submitted_at' => now()->subDays(rand(0, 10)),
                'reviewed_by_user_id' => $reviewedBy,
                'reviewed_at' => $reviewedAt,
                'review_note' => $reviewNote,
            ]);
        }
    }
}
