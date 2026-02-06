<?php

namespace Database\Seeders;

use App\Models\Sale;
use App\Models\Customer;
use App\Models\User;
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
        if ($customers->isEmpty()) {
            $this->command->warn('No customers found. Skipping SaleSeeder.');
            return;
        }

        // Helper to get random customer
        $getCustomer = fn() => $customers->random();
        $getWalkin = fn() => $customers->where('name', 'Walk-in Customer')->first();

        $entries = [
            [
                'sale_number' => 'SALE-20260120-0001',
                'sale_type' => 'walkin',
                'customer_id' => $getWalkin()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDays(7)->setHour(9)->setMinute(20),
                'subtotal' => 950.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 950.00,
                'notes' => null,
            ],
            [
                'sale_number' => 'SALE-20260120-0002',
                'sale_type' => 'delivery',
                'customer_id' => $customers->where('name', 'Juan Dela Cruz')->first()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDays(7)->setHour(14)->setMinute(30),
                'subtotal' => 1750.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 1750.00,
                'notes' => 'Delivery to Poblacion',
            ],
            [
                'sale_number' => 'SALE-20260121-0002',
                'sale_type' => 'delivery',
                'customer_id' => $customers->where('name', 'ABC Restaurant Corp.')->first()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDays(6)->setHour(11)->setMinute(45),
                'subtotal' => 5250.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 5250.00,
                'notes' => 'Corporate order - 3x 22kg cylinders',
            ],
            [
                'sale_number' => 'SALE-20260122-0002',
                'sale_type' => 'walkin',
                'customer_id' => $getWalkin()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDays(5)->setHour(13)->setMinute(20),
                'subtotal' => 1750.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 1750.00,
                'notes' => null,
            ],
            [
                'sale_number' => 'SALE-20260123-0001',
                'sale_type' => 'delivery',
                'customer_id' => $getCustomer()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDays(4)->setHour(10)->setMinute(30),
                'subtotal' => 3500.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 3500.00,
                'notes' => null,
            ],
            [
                'sale_number' => 'SALE-20260124-0001',
                'sale_type' => 'delivery',
                'customer_id' => $customers->where('name', 'Maria Santos')->first()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDays(3)->setHour(11)->setMinute(0),
                'subtotal' => 1750.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 1750.00,
                'notes' => null,
            ],
            [
                'sale_number' => 'SALE-20260125-0001',
                'sale_type' => 'walkin',
                'customer_id' => $getWalkin()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDays(2)->setHour(9)->setMinute(30),
                'subtotal' => 950.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 950.00,
                'notes' => null,
            ],
            [
                'sale_number' => 'SALE-20260125-0002',
                'sale_type' => 'delivery',
                'customer_id' => $getCustomer()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDays(2)->setHour(12)->setMinute(45),
                'subtotal' => 5250.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 5250.00,
                'notes' => 'Bulk order',
            ],
            [
                'sale_number' => 'SALE-20260126-0001',
                'sale_type' => 'walkin',
                'customer_id' => $getWalkin()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDay()->setHour(8)->setMinute(45),
                'subtotal' => 950.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 950.00,
                'notes' => null,
            ],
            [
                'sale_number' => 'SALE-20260126-0003',
                'sale_type' => 'walkin',
                'customer_id' => $getWalkin()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDay()->setHour(16)->setMinute(0),
                'subtotal' => 1750.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 1750.00,
                'notes' => null,
            ],
            [
                'sale_number' => 'SALE-20260127-0001',
                'sale_type' => 'walkin',
                'customer_id' => $getWalkin()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->setHour(9)->setMinute(10),
                'subtotal' => 950.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 950.00,
                'notes' => null,
            ],
            [
                'sale_number' => 'SALE-20260127-0002',
                'sale_type' => 'delivery',
                'customer_id' => $getCustomer()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->setHour(11)->setMinute(30),
                'subtotal' => 3500.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 3500.00,
                'notes' => null,
            ],
            [
                'sale_number' => 'SALE-20260127-0003',
                'sale_type' => 'delivery',
                'customer_id' => $getCustomer()?->id,
                'status' => 'pending',
                'sale_datetime' => now()->setHour(14)->setMinute(0),
                'subtotal' => 1750.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 1750.00,
                'notes' => 'Scheduled delivery - COD',
            ],
            [
                'sale_number' => 'SALE-20260127-0004',
                'sale_type' => 'walkin',
                'customer_id' => $getWalkin()?->id,
                'status' => 'paid',
                'sale_datetime' => now()->setHour(16)->setMinute(45),
                'subtotal' => 1750.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 1750.00,
                'notes' => null,
            ],
        ];

        $vatDefaults = [
            'vat_treatment' => 'exempt',
            'vat_rate' => 0.12,
            'vat_inclusive' => true,
            'vat_amount' => 0,
        ];

        foreach ($entries as $entry) {
            Sale::updateOrCreate(
                ['sale_number' => $entry['sale_number']],
                array_merge(
                    $entry,
                    $vatDefaults,
                    [
                        'net_amount' => $entry['grand_total'],
                        'gross_amount' => $entry['grand_total'],
                        'cashier_user_id' => $cashier->id,
                    ]
                )
            );
        }
    }
}
