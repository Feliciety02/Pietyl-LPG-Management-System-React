<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\User;
use App\Models\ProductVariant;
use Carbon\Carbon;

class PurchaseSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = Supplier::all();
        $user = User::first();
        $variants = ProductVariant::all();

        if ($suppliers->isEmpty() || !$user || $variants->isEmpty()) {
            $this->command->error('Please seed suppliers, users, and product variants first!');
            return;
        }

        // Hardcoded purchases
        $purchases = [];

        for ($i = 1; $i <= 30; $i++) {
            $statusOptions = ['pending', 'approved', 'awaiting_confirmation', 'completed', 'rejected'];
            $status = $statusOptions[$i % count($statusOptions)];

            $orderedAt = Carbon::now()->subDays($i);
            $receivedAt = in_array($status, ['completed', 'awaiting_confirmation']) 
                ? $orderedAt->copy()->addDays(2)
                : null;

            $purchases[] = [
                'purchase_number' => 'P-' . str_pad(46 + $i, 6, '0', STR_PAD_LEFT),
                'supplier_id' => $suppliers->random()->id,
                'created_by_user_id' => $user->id,
                'status' => $status,
                'ordered_at' => $orderedAt,
                'received_at' => $receivedAt,
                'items' => [
                    [
                        'qty' => rand(1, 20),
                        'unit_cost' => rand(100, 5000),
                    ],
                    [
                        'qty' => rand(1, 20),
                        'unit_cost' => rand(100, 5000),
                    ],
                ],
            ];
        }

        foreach ($purchases as $data) {
            $subtotal = 0;

            $purchase = Purchase::create([
                'purchase_number' => $data['purchase_number'],
                'supplier_id' => $data['supplier_id'],
                'created_by_user_id' => $data['created_by_user_id'],
                'status' => $data['status'],
                'ordered_at' => $data['ordered_at'],
                'received_at' => $data['received_at'],
                'subtotal' => 0, // calculate after items
                'grand_total' => 0,
                'created_at' => $data['ordered_at'],
            ]);

            foreach ($data['items'] as $item) {
                $lineTotal = $item['qty'] * $item['unit_cost'];

                // Determine received_qty based on status
                $receivedQty = match ($purchase->status) {
                    'completed' => $item['qty'],
                    'approved' => rand(0, $item['qty']),
                    'pending', 'awaiting_confirmation', 'rejected' => 0,
                    default => 0,
                };

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_variant_id' => $variants->random()->id,
                    'qty' => $item['qty'],
                    'received_qty' => $receivedQty,
                    'unit_cost' => $item['unit_cost'],
                    'line_total' => $lineTotal,
                ]);

                $subtotal += $lineTotal;
            }

            $purchase->update([
                'subtotal' => $subtotal,
                'grand_total' => $subtotal,
            ]);
        }
    }
}
