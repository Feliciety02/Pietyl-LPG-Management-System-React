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
    public function run(): void
    {
        $locations = Location::all();
        $user      = User::first();
        $variants  = ProductVariant::all();

        if ($locations->isEmpty() || !$user || $variants->isEmpty()) {
            $this->command->error('Please seed locations, users, and product variants first!');
            return;
        }

        $location         = $locations->first();
        $completedSale    = Sale::where('status', 'paid')->first();
        $completedPurchase = Purchase::where('status', 'completed')->first();

        $movements = [
            // PURCHASE_IN
            ['movement_type' => StockMovement::TYPE_PURCHASE_IN,    'qty' =>  50, 'days_ago' => 30, 'notes' => 'Initial bulk stock received from Cotabato Roma',         'ref_sale' => false, 'ref_purchase' => true],
            ['movement_type' => StockMovement::TYPE_PURCHASE_IN,    'qty' =>  30, 'days_ago' => 28, 'notes' => 'Restock of 22kg cylinders from Towngas',                  'ref_sale' => false, 'ref_purchase' => true],
            ['movement_type' => StockMovement::TYPE_PURCHASE_IN,    'qty' =>  20, 'days_ago' => 25, 'notes' => 'Accessories batch received from M.Conpinco',              'ref_sale' => false, 'ref_purchase' => true],
            ['movement_type' => StockMovement::TYPE_PURCHASE_IN,    'qty' =>  40, 'days_ago' => 22, 'notes' => '11kg cylinders received from CYBS Marketing',            'ref_sale' => false, 'ref_purchase' => true],
            ['movement_type' => StockMovement::TYPE_PURCHASE_IN,    'qty' =>  15, 'days_ago' => 20, 'notes' => '50kg industrial cylinders received',                      'ref_sale' => false, 'ref_purchase' => true],
            ['movement_type' => StockMovement::TYPE_PURCHASE_IN,    'qty' =>  25, 'days_ago' => 18, 'notes' => 'Emergency restock from Towngas LPG Trading',              'ref_sale' => false, 'ref_purchase' => true],
            ['movement_type' => StockMovement::TYPE_PURCHASE_IN,    'qty' =>  60, 'days_ago' => 15, 'notes' => 'Monthly regular order received',                          'ref_sale' => false, 'ref_purchase' => true],
            ['movement_type' => StockMovement::TYPE_PURCHASE_IN,    'qty' =>  10, 'days_ago' => 12, 'notes' => 'Small supplemental order of 2.7kg cylinders',             'ref_sale' => false, 'ref_purchase' => true],
            ['movement_type' => StockMovement::TYPE_PURCHASE_IN,    'qty' =>  35, 'days_ago' =>  9, 'notes' => 'Petron Gasul 22kg batch - pre-holiday restock',           'ref_sale' => false, 'ref_purchase' => true],
            ['movement_type' => StockMovement::TYPE_PURCHASE_IN,    'qty' =>  20, 'days_ago' =>  6, 'notes' => 'Solane 11kg cylinder top-up order',                       'ref_sale' => false, 'ref_purchase' => true],
            ['movement_type' => StockMovement::TYPE_PURCHASE_IN,    'qty' =>  45, 'days_ago' =>  3, 'notes' => 'Weekly standard LPG replenishment',                       'ref_sale' => false, 'ref_purchase' => true],
            ['movement_type' => StockMovement::TYPE_PURCHASE_IN,    'qty' =>  18, 'days_ago' =>  1, 'notes' => 'Latest delivery from Cotabato Roma Enterprises',          'ref_sale' => false, 'ref_purchase' => true],

            // SALE_OUT
            ['movement_type' => StockMovement::TYPE_SALE_OUT,       'qty' =>  -5, 'days_ago' => 29, 'notes' => 'Walk-in sale of 11kg cylinders',                         'ref_sale' => true,  'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_SALE_OUT,       'qty' =>  -3, 'days_ago' => 27, 'notes' => 'Delivery sale - ABC Restaurant Corp.',                   'ref_sale' => true,  'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_SALE_OUT,       'qty' =>  -8, 'days_ago' => 24, 'notes' => 'Bulk sale of 22kg cylinders to XYZ Hotel',               'ref_sale' => true,  'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_SALE_OUT,       'qty' =>  -2, 'days_ago' => 21, 'notes' => 'Walk-in sale - 50kg industrial cylinder',                'ref_sale' => true,  'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_SALE_OUT,       'qty' =>  -6, 'days_ago' => 19, 'notes' => 'Delivery sale via rider - Poblacion area',               'ref_sale' => true,  'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_SALE_OUT,       'qty' => -10, 'days_ago' => 16, 'notes' => 'Corporate bulk order - Mang Inasal Davao',               'ref_sale' => true,  'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_SALE_OUT,       'qty' =>  -4, 'days_ago' => 13, 'notes' => 'Regular customer delivery - Matina',                     'ref_sale' => true,  'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_SALE_OUT,       'qty' =>  -7, 'days_ago' => 10, 'notes' => 'Walk-in POS sales during morning rush',                  'ref_sale' => true,  'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_SALE_OUT,       'qty' =>  -9, 'days_ago' =>  8, 'notes' => 'Weekend delivery batch - Buhangin district',             'ref_sale' => true,  'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_SALE_OUT,       'qty' =>  -5, 'days_ago' =>  5, 'notes' => 'Daily POS transactions - afternoon shift',               'ref_sale' => true,  'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_SALE_OUT,       'qty' =>  -3, 'days_ago' =>  2, 'notes' => 'Express delivery - Lanang area',                         'ref_sale' => true,  'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_SALE_OUT,       'qty' =>  -6, 'days_ago' =>  0, 'notes' => 'Today\'s morning POS sales',                             'ref_sale' => true,  'ref_purchase' => false],

            // ADJUSTMENT (positive & negative)
            ['movement_type' => StockMovement::TYPE_ADJUSTMENT,     'qty' =>   3, 'days_ago' => 26, 'notes' => 'Found extra units in back storage during stocktake',     'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_ADJUSTMENT,     'qty' =>  -2, 'days_ago' => 23, 'notes' => 'Variance correction after physical count',               'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_ADJUSTMENT,     'qty' =>   1, 'days_ago' => 17, 'notes' => 'System discrepancy corrected by inventory manager',      'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_ADJUSTMENT,     'qty' =>  -3, 'days_ago' => 11, 'notes' => 'Quarterly audit count adjustment',                       'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_ADJUSTMENT,     'qty' =>   5, 'days_ago' =>  7, 'notes' => 'Returned cylinders restocked after inspection',          'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_ADJUSTMENT,     'qty' =>  -1, 'days_ago' =>  4, 'notes' => 'Minor count correction after spot check',                'ref_sale' => false, 'ref_purchase' => false],

            // DAMAGE
            ['movement_type' => StockMovement::TYPE_DAMAGE,         'qty' =>  -2, 'days_ago' => 29, 'notes' => 'Valve broken during transport - 11kg cylinder',          'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_DAMAGE,         'qty' =>  -1, 'days_ago' => 21, 'notes' => 'Corroded cylinder removed from circulation',             'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_DAMAGE,         'qty' =>  -3, 'days_ago' => 14, 'notes' => 'Dropped during unloading, cylinders dented',            'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_DAMAGE,         'qty' =>  -1, 'days_ago' =>  6, 'notes' => 'Regulator damaged on 22kg unit, unsafe for sale',        'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_DAMAGE,         'qty' =>  -2, 'days_ago' =>  2, 'notes' => 'Flood water exposure - 2 units condemned',              'ref_sale' => false, 'ref_purchase' => false],

            // TRANSFER_OUT
            ['movement_type' => StockMovement::TYPE_TRANSFER_OUT,   'qty' => -10, 'days_ago' => 27, 'notes' => 'Transfer to Matina Store for weekend stock',             'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_TRANSFER_OUT,   'qty' =>  -8, 'days_ago' => 20, 'notes' => 'Transferred to Bajada branch due to low stock',         'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_TRANSFER_OUT,   'qty' => -15, 'days_ago' => 13, 'notes' => 'Monthly rebalancing - South Warehouse to stores',        'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_TRANSFER_OUT,   'qty' =>  -5, 'days_ago' =>  7, 'notes' => 'Urgent transfer to Buhangin Store - stockout risk',     'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_TRANSFER_OUT,   'qty' => -12, 'days_ago' =>  3, 'notes' => 'Pre-holiday stock redistribution to branches',           'ref_sale' => false, 'ref_purchase' => false],

            // TRANSFER_IN
            ['movement_type' => StockMovement::TYPE_TRANSFER_IN,    'qty' =>  10, 'days_ago' => 26, 'notes' => 'Received transfer from Main Warehouse - Sasa',          'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_TRANSFER_IN,    'qty' =>   8, 'days_ago' => 18, 'notes' => 'Excess stock transferred in from Lanang branch',        'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_TRANSFER_IN,    'qty' =>  12, 'days_ago' => 11, 'notes' => 'Mid-week replenishment from central warehouse',          'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_TRANSFER_IN,    'qty' =>   6, 'days_ago' =>  5, 'notes' => 'Received overstock from Toril distribution center',     'ref_sale' => false, 'ref_purchase' => false],
            ['movement_type' => StockMovement::TYPE_TRANSFER_IN,    'qty' =>  20, 'days_ago' =>  1, 'notes' => 'Large transfer in from DC Calinan - monthly cycle',     'ref_sale' => false, 'ref_purchase' => false],
        ];

        foreach ($movements as $m) {
            StockMovement::create([
                'location_id'           => $locations->random()->id,
                'product_variant_id'    => $variants->random()->id,
                'movement_type'         => $m['movement_type'],
                'qty'                   => $m['qty'],
                'reference_type'        => $m['ref_purchase'] && $completedPurchase ? 'App\Models\Purchase'
                                         : ($m['ref_sale'] && $completedSale ? 'App\Models\Sale' : null),
                'reference_id'          => $m['ref_purchase'] && $completedPurchase ? $completedPurchase->id
                                         : ($m['ref_sale'] && $completedSale ? $completedSale->id : null),
                'performed_by_user_id'  => $user->id,
                'moved_at'              => Carbon::now()->subDays($m['days_ago']),
                'notes'                 => $m['notes'],
            ]);
        }

        $this->command->info('StockMovementSeeder: ' . count($movements) . ' movements created.');
    }
}