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
        $sales = Sale::all();
        
        if ($sales->isEmpty()) {
            $this->command->warn('No sales found. Run SaleSeeder first.');
            return;
        }

        $cashier = User::whereHas('roles', function ($q) {
            $q->where('name', 'cashier');
        })->first();

        if (!$cashier) {
            $this->command->warn('No cashier user found.');
            return;
        }

        // Get payment methods
        $cash = PaymentMethod::where('method_key', 'cash')->first();
        $gcash = PaymentMethod::where('method_key', 'gcash')->first();
        $card = PaymentMethod::where('method_key', 'card')->first();

        // Payment for Sale 1 - Cash
        if ($sales->count() >= 1 && $cash) {
            Payment::create([
                'sale_id' => $sales[0]->id,
                'payment_method_id' => $cash->id,
                'amount' => $sales[0]->grand_total,
                'reference_no' => null,
                'received_by_user_id' => $cashier->id,
                'paid_at' => $sales[0]->sale_datetime,
            ]);
        }

        // Payment for Sale 2 - GCash
        if ($sales->count() >= 2 && $gcash) {
            Payment::create([
                'sale_id' => $sales[1]->id,
                'payment_method_id' => $gcash->id,
                'amount' => $sales[1]->grand_total,
                'reference_no' => 'GCASH-' . strtoupper(substr(md5(rand()), 0, 10)),
                'received_by_user_id' => $cashier->id,
                'paid_at' => $sales[1]->sale_datetime,
            ]);
        }

        // Payment for Sale 3 - Card
        if ($sales->count() >= 3 && $card) {
            Payment::create([
                'sale_id' => $sales[2]->id,
                'payment_method_id' => $card->id,
                'amount' => $sales[2]->grand_total,
                'reference_no' => 'CARD-' . strtoupper(substr(md5(rand()), 0, 10)),
                'received_by_user_id' => $cashier->id,
                'paid_at' => $sales[2]->sale_datetime,
            ]);
        }

        // Payment for Sale 4 - Cash
        if ($sales->count() >= 4 && $cash) {
            Payment::create([
                'sale_id' => $sales[3]->id,
                'payment_method_id' => $cash->id,
                'amount' => $sales[3]->grand_total,
                'reference_no' => null,
                'received_by_user_id' => $cashier->id,
                'paid_at' => $sales[3]->sale_datetime,
            ]);
        }

        // Payment for Sale 5 - GCash
        if ($sales->count() >= 5 && $gcash) {
            Payment::create([
                'sale_id' => $sales[4]->id,
                'payment_method_id' => $gcash->id,
                'amount' => $sales[4]->grand_total,
                'reference_no' => 'GCASH-' . strtoupper(substr(md5(rand()), 0, 10)),
                'received_by_user_id' => $cashier->id,
                'paid_at' => $sales[4]->sale_datetime,
            ]);
        }
    }
}