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
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get required data
        $suppliers = Supplier::all();
        $user = User::first();
        $variants = ProductVariant::all();

        if ($suppliers->isEmpty() || !$user || $variants->isEmpty()) {
            $this->command->error('Please seed suppliers, users, and product variants first!');
            return;
        }

        // Purchase 1: Pending
        $purchase1 = Purchase::create([
            'purchase_number' => 'P-000051',
            'supplier_id' => $suppliers->random()->id,
            'created_by_user_id' => $user->id,
            'status' => 'pending',
            'ordered_at' => Carbon::now(),
            'subtotal' => 11760.00,
            'grand_total' => 11760.00,
            'created_at' => Carbon::now(),
        ]);

        PurchaseItem::create([
            'purchase_id' => $purchase1->id,
            'product_variant_id' => $variants->random()->id,
            'qty' => 12,
            'unit_cost' => 980.00,
            'line_total' => 11760.00,
        ]);

        // Purchase 2: Approved
        $purchase2 = Purchase::create([
            'purchase_number' => 'P-000050',
            'supplier_id' => $suppliers->random()->id,
            'created_by_user_id' => $user->id,
            'status' => 'approved',
            'ordered_at' => Carbon::yesterday(),
            'subtotal' => 11100.00,
            'grand_total' => 11100.00,
            'created_at' => Carbon::yesterday(),
        ]);

        PurchaseItem::create([
            'purchase_id' => $purchase2->id,
            'product_variant_id' => $variants->random()->id,
            'qty' => 6,
            'unit_cost' => 1850.00,
            'line_total' => 11100.00,
        ]);

        // Purchase 3: Awaiting Confirmation
        $purchase3 = Purchase::create([
            'purchase_number' => 'P-000049',
            'supplier_id' => $suppliers->random()->id,
            'created_by_user_id' => $user->id,
            'status' => 'awaiting_confirmation',
            'ordered_at' => Carbon::now()->subDays(5),
            'received_at' => Carbon::now()->subDays(2),
            'subtotal' => 8400.00,
            'grand_total' => 8400.00,
            'created_at' => Carbon::now()->subDays(5),
        ]);

        PurchaseItem::create([
            'purchase_id' => $purchase3->id,
            'product_variant_id' => $variants->random()->id,
            'qty' => 2,
            'unit_cost' => 4200.00,
            'line_total' => 8400.00,
        ]);

        // Purchase 4: Completed
        $purchase4 = Purchase::create([
            'purchase_number' => 'P-000048',
            'supplier_id' => $suppliers->random()->id,
            'created_by_user_id' => $user->id,
            'status' => 'completed',
            'ordered_at' => Carbon::now()->subDays(10),
            'received_at' => Carbon::now()->subDays(7),
            'subtotal' => 15000.00,
            'grand_total' => 15000.00,
            'created_at' => Carbon::now()->subDays(10),
        ]);

        PurchaseItem::create([
            'purchase_id' => $purchase4->id,
            'product_variant_id' => $variants->random()->id,
            'qty' => 10,
            'unit_cost' => 1500.00,
            'line_total' => 15000.00,
        ]);

        // Purchase 5: Rejected
        $purchase5 = Purchase::create([
            'purchase_number' => 'P-000047',
            'supplier_id' => $suppliers->random()->id,
            'created_by_user_id' => $user->id,
            'status' => 'rejected',
            'ordered_at' => Carbon::now()->subDays(15),
            'subtotal' => 5000.00,
            'grand_total' => 5000.00,
            'created_at' => Carbon::now()->subDays(15),
        ]);

        PurchaseItem::create([
            'purchase_id' => $purchase5->id,
            'product_variant_id' => $variants->random()->id,
            'qty' => 5,
            'unit_cost' => 1000.00,
            'line_total' => 5000.00,
        ]);

    }
}