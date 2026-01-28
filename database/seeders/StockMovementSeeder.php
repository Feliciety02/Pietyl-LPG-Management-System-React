<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StockMovement;
use App\Models\Location;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Sale;
use App\Models\Purchase;
use Carbon\Carbon;

class StockMovementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get required data
        $location = Location::first();
        $user = User::first();
        $variants = ProductVariant::all();

        if (!$location || !$user || $variants->isEmpty()) {
            $this->command->error('⚠️  Please seed locations, users, and product variants first!');
            return;
        }

        $completedSale = Sale::where('status', 'paid')->first();
        $completedPurchase = Purchase::where('status', 'completed')->first();

        // Movement 1: Purchase IN (stock received)
        StockMovement::create([
            'location_id' => $location->id,
            'product_variant_id' => $variants->random()->id,
            'movement_type' => StockMovement::TYPE_PURCHASE_IN,
            'qty' => 50,
            'reference_type' => $completedPurchase ? 'App\Models\Purchase' : null,
            'reference_id' => $completedPurchase?->id,
            'performed_by_user_id' => $user->id,
            'moved_at' => Carbon::now()->subDays(10),
            'notes' => 'Initial stock received from supplier',
        ]);

        // Movement 2: Sale OUT (sold to customer)
        StockMovement::create([
            'location_id' => $location->id,
            'product_variant_id' => $variants->random()->id,
            'movement_type' => StockMovement::TYPE_SALE_OUT,
            'qty' => -5,
            'reference_type' => $completedSale ? 'App\Models\Sale' : null,
            'reference_id' => $completedSale?->id,
            'performed_by_user_id' => $user->id,
            'moved_at' => Carbon::now()->subDays(7),
            'notes' => 'Sold to customer via POS',
        ]);

        // Movement 3: Adjustment (inventory correction)
        StockMovement::create([
            'location_id' => $location->id,
            'product_variant_id' => $variants->random()->id,
            'movement_type' => StockMovement::TYPE_ADJUSTMENT,
            'qty' => 3,
            'reference_type' => null,
            'reference_id' => null,
            'performed_by_user_id' => $user->id,
            'moved_at' => Carbon::now()->subDays(5),
            'notes' => 'Found extra units during stocktake',
        ]);

        // Movement 4: Damage (damaged/defective items)
        StockMovement::create([
            'location_id' => $location->id,
            'product_variant_id' => $variants->random()->id,
            'movement_type' => StockMovement::TYPE_DAMAGE,
            'qty' => -2,
            'reference_type' => null,
            'reference_id' => null,
            'performed_by_user_id' => $user->id,
            'moved_at' => Carbon::now()->subDays(3),
            'notes' => 'Damaged cylinder - valve broken, cannot be used',
        ]);

        // Movement 5: Transfer OUT (to another location)
        StockMovement::create([
            'location_id' => $location->id,
            'product_variant_id' => $variants->random()->id,
            'movement_type' => StockMovement::TYPE_TRANSFER_OUT,
            'qty' => -10,
            'reference_type' => null,
            'reference_id' => null,
            'performed_by_user_id' => $user->id,
            'moved_at' => Carbon::now()->subDays(2),
            'notes' => 'Transferred to branch warehouse',
        ]);

        // Movement 6: Purchase IN (another stock received)
        StockMovement::create([
            'location_id' => $location->id,
            'product_variant_id' => $variants->random()->id,
            'movement_type' => StockMovement::TYPE_PURCHASE_IN,
            'qty' => 25,
            'reference_type' => null,
            'reference_id' => null,
            'performed_by_user_id' => $user->id,
            'moved_at' => Carbon::now()->subDays(1),
            'notes' => 'Emergency stock replenishment',
        ]);
    }
}