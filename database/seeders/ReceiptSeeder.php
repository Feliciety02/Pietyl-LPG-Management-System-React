<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Receipt;
use App\Models\Sale;
use Carbon\Carbon;

class ReceiptSeeder extends Seeder
{
    public function run(): void
    {
        $sales = Sale::whereDoesntHave('receipt')->get();

        if ($sales->isEmpty()) {
            $this->command->info('No sales without receipts found. Create sales first!');
            return;
        }

        $count = 0;
        foreach ($sales as $sale) {
            Receipt::create([
                'sale_id'        => $sale->id,
                'receipt_number' => Receipt::generateReceiptNumber(),
                'printed_count'  => rand(0, 3),
                'issued_at'      => $sale->sale_datetime ?? Carbon::now(),
            ]);
            $count++;
        }

        $this->command->info("ReceiptSeeder: {$count} receipts created.");
    }
}