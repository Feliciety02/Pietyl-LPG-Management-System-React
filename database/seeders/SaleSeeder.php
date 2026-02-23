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
        $cashiers = User::whereHas('roles', fn($q) => $q->where('name', 'cashier'))->get();

        if ($cashiers->isEmpty()) {
            $this->command->warn('No cashier users found. Skipping SaleSeeder.');
            return;
        }

        $customers = Customer::all();
        if ($customers->isEmpty()) {
            $this->command->warn('No customers found. Skipping SaleSeeder.');
            return;
        }

        $walkin     = $customers->where('customer_type', 'walkin')->first()
                      ?? $customers->first();
        $corporates = $customers->where('customer_type', 'corporate');
        $regulars   = $customers->where('customer_type', 'regular');

        $amounts = [950.00, 1750.00, 3500.00, 5250.00, 7000.00, 10500.00];

        $entries = [];

        // ── Generate sales over the past 30 days ──────────────────────────
        // Each cashier gets 3 sales per day for 7 days = enough to exceed 50
        // even with just 1 cashier.
        for ($daysAgo = 30; $daysAgo >= 0; $daysAgo--) {
            $date    = now()->subDays($daysAgo);
            $dateStr = $date->format('Ymd');

            foreach ($cashiers as $ci => $cashier) {
                $salesCount = rand(3, 6);

                for ($i = 1; $i <= $salesCount; $i++) {
                    $hour     = rand(8, 17);
                    $minute   = rand(0, 59);
                    $isWalkin = rand(0, 100) > 30;
                    $customer = $isWalkin
                        ? $walkin
                        : ($regulars->isNotEmpty() ? $regulars->random() : $walkin);
                    $saleType = $isWalkin ? 'walkin' : 'delivery';
                    $amount   = $amounts[array_rand($amounts)];

                    $entries[] = [
                        'sale_number'       => sprintf('SALE-%s-%04d', $dateStr, ($ci * 100) + $i),
                        'sale_type'         => $saleType,
                        'customer_id'       => $customer?->id,
                        'cashier_user_id'   => $cashier->id,
                        'status'            => 'paid',
                        'sale_datetime'     => $date->copy()->setHour($hour)->setMinute($minute),
                        'subtotal'          => $amount,
                        'discount_total'    => 0,
                        'tax_total'         => 0,
                        'grand_total'       => $amount,
                        'notes'             => $saleType === 'delivery' ? 'Delivery order' : null,
                    ];
                }
            }
        }

        // ── Special named sales ───────────────────────────────────────────
        $specialSales = [
            [
                'sale_number'     => 'SALE-' . now()->subDays(25)->format('Ymd') . '-9001',
                'sale_type'       => 'delivery',
                'customer_id'     => $corporates->where('name', 'ABC Restaurant Corp.')->first()?->id
                                     ?? $corporates->first()?->id,
                'cashier_user_id' => $cashiers->first()->id,
                'status'          => 'paid',
                'sale_datetime'   => now()->subDays(25)->setHour(10)->setMinute(30),
                'subtotal'        => 15750.00,
                'discount_total'  => 0,
                'tax_total'       => 0,
                'grand_total'     => 15750.00,
                'notes'           => 'Bulk corporate order - 9x 22kg cylinders',
            ],
            [
                'sale_number'     => 'SALE-' . now()->subDays(20)->format('Ymd') . '-9002',
                'sale_type'       => 'delivery',
                'customer_id'     => $corporates->where('name', 'XYZ Hotel')->first()?->id
                                     ?? $corporates->first()?->id,
                'cashier_user_id' => $cashiers->last()->id,
                'status'          => 'paid',
                'sale_datetime'   => now()->subDays(20)->setHour(9)->setMinute(0),
                'subtotal'        => 21000.00,
                'discount_total'  => 500.00,
                'tax_total'       => 0,
                'grand_total'     => 20500.00,
                'notes'           => 'Hotel monthly order - 12x 22kg cylinders, loyalty discount applied',
            ],
            [
                'sale_number'     => 'SALE-' . now()->subDays(15)->format('Ymd') . '-9003',
                'sale_type'       => 'delivery',
                'customer_id'     => $corporates->where('name', 'Mang Inasal - Davao Branch')->first()?->id
                                     ?? $corporates->first()?->id,
                'cashier_user_id' => $cashiers->first()->id,
                'status'          => 'paid',
                'sale_datetime'   => now()->subDays(15)->setHour(8)->setMinute(15),
                'subtotal'        => 10500.00,
                'discount_total'  => 0,
                'tax_total'       => 0,
                'grand_total'     => 10500.00,
                'notes'           => 'Large order - 6x 22kg cylinders',
            ],
            [
                'sale_number'     => 'SALE-' . now()->subDays(10)->format('Ymd') . '-9004',
                'sale_type'       => 'delivery',
                'customer_id'     => $regulars->where('name', 'Maria Santos')->first()?->id
                                     ?? $regulars->first()?->id,
                'cashier_user_id' => $cashiers->first()->id,
                'status'          => 'paid',
                'sale_datetime'   => now()->subDays(10)->setHour(16)->setMinute(45),
                'subtotal'        => 7000.00,
                'discount_total'  => 0,
                'tax_total'       => 0,
                'grand_total'     => 7000.00,
                'notes'           => 'Monthly bulk order',
            ],
            [
                'sale_number'     => 'SALE-' . now()->subDays(5)->format('Ymd') . '-9005',
                'sale_type'       => 'delivery',
                'customer_id'     => $corporates->where('name', 'Golden Palace Restaurant')->first()?->id
                                     ?? $corporates->first()?->id,
                'cashier_user_id' => $cashiers->last()->id,
                'status'          => 'paid',
                'sale_datetime'   => now()->subDays(5)->setHour(11)->setMinute(0),
                'subtotal'        => 14000.00,
                'discount_total'  => 0,
                'tax_total'       => 0,
                'grand_total'     => 14000.00,
                'notes'           => 'Corporate event order - 4x 50kg cylinders',
            ],
            [
                'sale_number'     => 'SALE-' . now()->subDays(3)->format('Ymd') . '-9006',
                'sale_type'       => 'walkin',
                'customer_id'     => $walkin?->id,
                'cashier_user_id' => $cashiers->first()->id,
                'status'          => 'paid',
                'sale_datetime'   => now()->subDays(3)->setHour(14)->setMinute(20),
                'subtotal'        => 3500.00,
                'discount_total'  => 0,
                'tax_total'       => 0,
                'grand_total'     => 3500.00,
                'notes'           => null,
            ],
            [
                'sale_number'     => 'SALE-' . now()->subDays(1)->format('Ymd') . '-9007',
                'sale_type'       => 'delivery',
                'customer_id'     => $regulars->where('name', 'Carlos Ramos')->first()?->id
                                     ?? $regulars->first()?->id,
                'cashier_user_id' => $cashiers->last()->id,
                'status'          => 'paid',
                'sale_datetime'   => now()->subDays(1)->setHour(13)->setMinute(30),
                'subtotal'        => 5250.00,
                'discount_total'  => 0,
                'tax_total'       => 0,
                'grand_total'     => 5250.00,
                'notes'           => 'VIP customer - priority delivery',
            ],
        ];

        $entries = array_merge($entries, $specialSales);

        $vatDefaults = [
            'vat_treatment' => 'exempt',
            'vat_rate'      => 0.12,
            'vat_inclusive' => true,
            'vat_amount'    => 0,
        ];

        foreach ($entries as $entry) {
            Sale::updateOrCreate(
                ['sale_number' => $entry['sale_number']],
                array_merge($entry, $vatDefaults, [
                    'net_amount'   => $entry['grand_total'],
                    'gross_amount' => $entry['grand_total'],
                ])
            );
        }

        $this->command->info('SaleSeeder: ' . count($entries) . ' sales created across ' . $cashiers->count() . ' cashier(s) over 30 days.');
    }
}