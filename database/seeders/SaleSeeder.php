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
        // Get all cashiers
        $cashiers = User::whereHas('roles', function ($q) {
            $q->where('name', 'cashier');
        })->get();

        if ($cashiers->isEmpty()) {
            $this->command->warn('No cashier users found. Skipping SaleSeeder.');
            return;
        }

        $customers = Customer::all();
        if ($customers->isEmpty()) {
            $this->command->warn('No customers found. Skipping SaleSeeder.');
            return;
        }

        // Helper functions
        $getCustomer = fn() => $customers->random();
        $getWalkin = fn() => $customers->where('name', 'Walk-in Customer')->first();
        $getCashier = fn() => $cashiers->random();

        $entries = [];

        // Generate sales for the past 14 days with multiple cashiers
        for ($daysAgo = 14; $daysAgo >= 0; $daysAgo--) {
            $date = now()->subDays($daysAgo);
            $dateStr = $date->format('Ymd');
            
            // Each cashier gets 5-10 sales per day
            foreach ($cashiers as $cashierIndex => $cashier) {
                $salesCount = rand(5, 10);
                
                for ($i = 1; $i <= $salesCount; $i++) {
                    $hour = rand(8, 17);
                    $minute = rand(0, 59);
                    $saleType = rand(0, 100) > 30 ? 'walkin' : 'delivery';
                    $customer = $saleType === 'walkin' ? $getWalkin() : $getCustomer();
                    
                    // Random amounts (950, 1750, 3500, 5250)
                    $amounts = [950.00, 1750.00, 3500.00, 5250.00];
                    $amount = $amounts[array_rand($amounts)];
                    
                    $saleNumber = sprintf('SALE-%s-%04d', $dateStr, ($cashierIndex * 100) + $i);
                    
                    $entries[] = [
                        'sale_number' => $saleNumber,
                        'sale_type' => $saleType,
                        'customer_id' => $customer?->id,
                        'cashier_user_id' => $cashier->id,
                        'status' => 'paid',
                        'sale_datetime' => $date->copy()->setHour($hour)->setMinute($minute),
                        'subtotal' => $amount,
                        'discount_total' => 0,
                        'tax_total' => 0,
                        'grand_total' => $amount,
                        'notes' => $saleType === 'delivery' ? 'Delivery order' : null,
                    ];
                }
            }
        }

        // Add some specific high-value sales for variety
        $specialSales = [
            [
                'sale_number' => 'SALE-' . now()->subDays(10)->format('Ymd') . '-9001',
                'sale_type' => 'delivery',
                'customer_id' => $customers->where('name', 'ABC Restaurant Corp.')->first()?->id,
                'cashier_user_id' => $cashiers->first()->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDays(10)->setHour(10)->setMinute(30),
                'subtotal' => 15750.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 15750.00,
                'notes' => 'Bulk corporate order - 9x 22kg cylinders',
            ],
            [
                'sale_number' => 'SALE-' . now()->subDays(7)->format('Ymd') . '-9002',
                'sale_type' => 'delivery',
                'customer_id' => $getCustomer()?->id,
                'cashier_user_id' => $cashiers->last()->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDays(7)->setHour(14)->setMinute(15),
                'subtotal' => 10500.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 10500.00,
                'notes' => 'Large order - 6x 22kg cylinders',
            ],
            [
                'sale_number' => 'SALE-' . now()->subDays(3)->format('Ymd') . '-9003',
                'sale_type' => 'delivery',
                'customer_id' => $customers->where('name', 'Maria Santos')->first()?->id,
                'cashier_user_id' => $cashiers->first()->id,
                'status' => 'paid',
                'sale_datetime' => now()->subDays(3)->setHour(16)->setMinute(45),
                'subtotal' => 7000.00,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => 7000.00,
                'notes' => 'Monthly bulk order',
            ],
        ];

        $entries = array_merge($entries, $specialSales);

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
                    ]
                )
            );
        }

        $this->command->info('Created ' . count($entries) . ' sales across ' . $cashiers->count() . ' cashiers over 15 days.');
    }
}