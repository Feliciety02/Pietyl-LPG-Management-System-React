<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            [
                'method_key' => 'cash',
                'name' => 'Cash',
                'is_cashless' => false,
                'is_active' => true,
            ],
            [
                'method_key' => 'gcash',
                'name' => 'GCash',
                'is_cashless' => true,
                'is_active' => true,
            ],
            [
                'method_key' => 'card',
                'name' => 'Credit/Debit Card',
                'is_cashless' => true,
                'is_active' => true,
            ],
            [
                'method_key' => 'bank_transfer',
                'name' => 'Bank Transfer',
                'is_cashless' => true,
                'is_active' => true,
            ],
        ];

        foreach ($methods as $method) {
            PaymentMethod::updateOrCreate(
                ['method_key' => $method['method_key']],
                [
                    'name' => $method['name'],
                    'is_cashless' => $method['is_cashless'],
                    'is_active' => $method['is_active'],
                ]
            );
        }

        $this->command->info('Payment methods seeded with is_cashless field.');
    }
}