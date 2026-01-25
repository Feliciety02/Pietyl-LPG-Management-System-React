<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Default Walk-in Customer (for POS transactions without specific customer)
        Customer::create([
            'name' => 'Walk-in Customer',
            'phone' => null,
            'email' => null,
            'customer_type' => 'walkin',
            'notes' => 'Default customer for walk-in transactions',
        ]);

        // 2. Regular Customers
        Customer::create([
            'name' => 'Juan Dela Cruz',
            'phone' => '09171234567',
            'email' => 'juan.delacruz@gmail.com',
            'customer_type' => 'regular',
            'notes' => 'Loyal customer since 2023',
        ]);

        Customer::create([
            'name' => 'Maria Santos',
            'phone' => '09281234567',
            'email' => 'maria.santos@yahoo.com',
            'customer_type' => 'regular',
            'notes' => 'Weekly delivery schedule',
        ]);

        Customer::create([
            'name' => 'Pedro Reyes',
            'phone' => '09391234567',
            'email' => null,
            'customer_type' => 'regular',
            'notes' => 'Prefers cash payment',
        ]);

        // 3. Corporate Customers
        Customer::create([
            'name' => 'ABC Restaurant Corp.',
            'phone' => '09451234567',
            'email' => 'purchasing@abcrestaurant.com',
            'customer_type' => 'corporate',
            'notes' => 'Bulk orders every Monday and Thursday',
        ]);

        Customer::create([
            'name' => 'XYZ Hotel',
            'phone' => '09561234567',
            'email' => 'admin@xyzhotel.com',
            'customer_type' => 'corporate',
            'notes' => 'Monthly billing arrangement',
        ]);

        Customer::create([
            'name' => 'Mang Inasal - Davao Branch',
            'phone' => '09671234567',
            'email' => 'davao@manginasal.com',
            'customer_type' => 'corporate',
            'notes' => 'Contact: Karen (Manager)',
        ]);

        // 4. More Regular Customers
        Customer::create([
            'name' => 'Ana Garcia',
            'phone' => '09781234567',
            'email' => 'ana.garcia@outlook.com',
            'customer_type' => 'regular',
            'notes' => 'Senior citizen discount applicable',
        ]);

        Customer::create([
            'name' => 'Roberto Tan',
            'phone' => '09891234567',
            'email' => 'roberto.tan@gmail.com',
            'customer_type' => 'regular',
            'notes' => null,
        ]);

        Customer::create([
            'name' => 'Luz Mendoza',
            'phone' => '09901234567',
            'email' => null,
            'customer_type' => 'regular',
            'notes' => 'Delivery address: Poblacion District',
        ]);

        Customer::create([
            'name' => 'Carlos Ramos',
            'phone' => '09012345678',
            'email' => 'carlos.ramos@yahoo.com',
            'customer_type' => 'regular',
            'notes' => 'VIP customer - priority delivery',
        ]);
    }
}