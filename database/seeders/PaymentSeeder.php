<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Sale;
use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $sales = Sale::with('cashier')->get();
        
        if ($sales->isEmpty()) {
            $this->command->warn('No sales found. Run SaleSeeder first.');
            return;
        }

        // Get payment methods
        $cash = PaymentMethod::where('method_key', 'cash')->first();
        $gcash = PaymentMethod::where('method_key', 'gcash')->first();
        $card = PaymentMethod::where('method_key', 'card')->first();

        if (!$cash || !$gcash || !$card) {
            $this->command->warn('Payment methods not found. Run PaymentMethodSeeder first.');
            return;
        }

        $paymentMethods = [
            ['method' => $cash, 'weight' => 60],      // 60% cash
            ['method' => $gcash, 'weight' => 25],     // 25% gcash
            ['method' => $card, 'weight' => 15],      // 15% card
        ];

        $createdCount = 0;

        foreach ($sales as $sale) {
            // Skip if payment already exists
            if (Payment::where('sale_id', $sale->id)->exists()) {
                continue;
            }

            // Get the cashier who made the sale
            $cashier = $sale->cashier;
            
            if (!$cashier) {
                $this->command->warn("Sale {$sale->sale_number} has no cashier. Skipping payment.");
                continue;
            }

            // Randomly select payment method based on weights
            $selectedMethod = $this->weightedRandom($paymentMethods);

            $paymentData = [
                'sale_id' => $sale->id,
                'payment_method_id' => $selectedMethod->id,
                'amount' => $sale->grand_total,
                'received_by_user_id' => $cashier->id,
                'paid_at' => $sale->sale_datetime,
            ];

            // Add reference number for non-cash payments
            if ($selectedMethod->method_key !== 'cash') {
                $prefix = strtoupper($selectedMethod->method_key);
                $paymentData['reference_no'] = $prefix . '-' . strtoupper(substr(md5($sale->id . time()), 0, 10));
            } else {
                $paymentData['reference_no'] = null;
            }

            Payment::create($paymentData);
            $createdCount++;
        }

        $this->command->info("Created {$createdCount} payments for {$sales->count()} sales.");
        
        // Show payment method distribution
        $cashCount = Payment::whereHas('paymentMethod', fn($q) => $q->where('method_key', 'cash'))->count();
        $gcashCount = Payment::whereHas('paymentMethod', fn($q) => $q->where('method_key', 'gcash'))->count();
        $cardCount = Payment::whereHas('paymentMethod', fn($q) => $q->where('method_key', 'card'))->count();
        
        $this->command->info("Payment distribution: Cash={$cashCount}, GCash={$gcashCount}, Card={$cardCount}");
    }

    /**
     * Select a random payment method based on weights
     */
    private function weightedRandom(array $weightedItems)
    {
        $totalWeight = array_sum(array_column($weightedItems, 'weight'));
        $random = rand(1, $totalWeight);
        
        $currentWeight = 0;
        foreach ($weightedItems as $item) {
            $currentWeight += $item['weight'];
            if ($random <= $currentWeight) {
                return $item['method'];
            }
        }
        
        // Fallback to first item
        return $weightedItems[0]['method'];
    }
}