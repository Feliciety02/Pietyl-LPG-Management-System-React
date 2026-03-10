<?php

namespace App\Console\Commands;

use App\Http\Controllers\Cashier\POSController;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

class TestConcurrentSale extends Command
{
    protected $signature = 'pos:test-concurrent';
    protected $description = 'Test concurrent sale blocking';

    public function handle(): void
    {
        $user = User::first();

        $payload = [
            'customer_id'    => 1,
            'payment_method' => 'cash',
            'is_delivery'    => false,
            'vat_treatment'  => 'vatable_12',
            'vat_inclusive'  => true,
            'vat_rate'       => 12,
            'cash_tendered'  => 500,
            'lines'          => [
                [
                    'product_id' => 1,
                    'qty'        => 1,
                    'mode'       => 'refill',
                    'unit_price' => 250,
                ],
            ],
        ];

        $request1 = Request::create('/dashboard/cashier/POS', 'POST', $payload);
        $request1->setUserResolver(fn() => $user);

        $request2 = Request::create('/dashboard/cashier/POS', 'POST', $payload);
        $request2->setUserResolver(fn() => $user);

        $controller = app(POSController::class);

        $this->info('Firing request 1...');
        $response1 = $controller->storeDataPos($request1);

        $this->info('Firing request 2...');
        $response2 = $controller->storeDataPos($request2);

        $session1 = $response1->getSession();
        $session2 = $response2->getSession();

        $this->info('Request 1: ' . ($session1->get('success') ?? json_encode($session1->get('errors'))));
        $this->info('Request 2: ' . ($session2->get('success') ?? json_encode($session2->get('errors'))));
    }
}