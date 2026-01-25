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
                'is_active' => true,
            ],
            [
                'method_key' => 'gcash',
                'name' => 'GCash',
                'is_active' => true,
            ],
            [
                'method_key' => 'card',
                'name' => 'Credit/Debit Card',
                'is_active' => true,
            ],
            [
                'method_key' => 'bank_transfer',
                'name' => 'Bank Transfer',
                'is_active' => true,
            ],
        ];

        foreach ($methods as $method) {
            PaymentMethod::create($method);
        }
    }
}