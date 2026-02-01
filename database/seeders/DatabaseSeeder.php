<?php

namespace Database\Seeders;

use App\Models\Receipt;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            UserSeeder::class,
            ChartOfAccountsSeeder::class,
            LocationSeeder::class,
            SupplierProductResetSeeder::class,
            InventoryBalanceSeeder::class,
            StockCountSeeder::class,
            CustomerSeeder::class,
            CustomerAddressSeeder::class,
            PaymentMethodSeeder::class,
            SaleSeeder::class,
            SaleItemSeeder::class,
            PaymentSeeder::class,
            PurchaseSeeder::class,
            ReceiptSeeder::class,
            StockMovementSeeder::class,
            DeliverySeeder::class,
            RestockRequestSeeder::class,
            RestockRequestItemSeeder::class,
        ]);
    }
}
