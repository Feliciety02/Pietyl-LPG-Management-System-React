<?php

namespace Database\Seeders;

use App\Models\Sale;
use App\Models\Customer;
use App\Models\User;
use App\Models\PriceList;
use Illuminate\Database\Seeder;

class SaleSeeder extends Seeder
{
    public function run(): void
    {
        // Get data
        $cashier = User::whereHas('roles', function ($q) {
            $q->where('name', 'cashier');
        })->first();

        if (!$cashier) {
            $this->command->warn('No cashier user found. Skipping SaleSeeder.');
            return;
        }

        $customers = Customer::all();
        $priceList = PriceList::where('is_active', true)->first();

        if ($customers->isEmpty()) {
            $this->command->warn('No customers found. Skipping SaleSeeder.');
            return;
        }

        // Sample Sales
        Sale::create([
            'sale_number' => 'SALE-20260125-0001',
            'sale_type' => 'walkin',
            'customer_id' => $customers->where('name', 'Walk-in Customer')->first()?->id,
            'cashier_user_id' => $cashier->id,
            'status' => 'paid',
            'sale_datetime' => now()->subDays(2)->setHour(9)->setMinute(20),
            'price_list_id' => $priceList?->id,
            'subtotal' => 950.00,
            'discount_total' => 0,
            'tax_total' => 0,
            'grand_total' => 950.00,
            'notes' => null,
        ]);

        Sale::create([
            'sale_number' => 'SALE-20260125-0002',
            'sale_type' => 'delivery',
            'customer_id' => $customers->where('name', 'Juan Dela Cruz')->first()?->id,
            'cashier_user_id' => $cashier->id,
            'status' => 'paid',
            'sale_datetime' => now()->subDays(1)->setHour(14)->setMinute(30),
            'price_list_id' => $priceList?->id,
            'subtotal' => 1750.00,
            'discount_total' => 0,
            'tax_total' => 0,
            'grand_total' => 1750.00,
            'notes' => 'Delivery to Poblacion',
        ]);

        Sale::create([
            'sale_number' => 'SALE-20260126-0001',
            'sale_type' => 'walkin',
            'customer_id' => $customers->where('name', 'Maria Santos')->first()?->id,
            'cashier_user_id' => $cashier->id,
            'status' => 'paid',
            'sale_datetime' => now()->setHour(10)->setMinute(15),
            'price_list_id' => $priceList?->id,
            'subtotal' => 3500.00,
            'discount_total' => 0,
            'tax_total' => 0,
            'grand_total' => 3500.00,
            'notes' => null,
        ]);

        Sale::create([
            'sale_number' => 'SALE-20260126-0002',
            'sale_type' => 'delivery',
            'customer_id' => $customers->where('name', 'ABC Restaurant Corp.')->first()?->id,
            'cashier_user_id' => $cashier->id,
            'status' => 'paid',
            'sale_datetime' => now()->setHour(11)->setMinute(45),
            'price_list_id' => $priceList?->id,
            'subtotal' => 5250.00,
            'discount_total' => 0,
            'tax_total' => 0,
            'grand_total' => 5250.00,
            'notes' => 'Corporate order - 3x 22kg cylinders',
        ]);

        Sale::create([
            'sale_number' => 'SALE-20260126-0003',
            'sale_type' => 'walkin',
            'customer_id' => $customers->where('name', 'Walk-in Customer')->first()?->id,
            'cashier_user_id' => $cashier->id,
            'status' => 'paid',
            'sale_datetime' => now()->setHour(15)->setMinute(20),
            'price_list_id' => $priceList?->id,
            'subtotal' => 950.00,
            'discount_total' => 0,
            'tax_total' => 0,
            'grand_total' => 950.00,
            'notes' => null,
        ]);
    }
}