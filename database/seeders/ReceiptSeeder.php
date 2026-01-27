<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Receipt;
use App\Models\Sale;
use Carbon\Carbon;

class ReceiptSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get sales that don't have receipts yet
        $sales = Sale::whereDoesntHave('receipt')->get();

        if ($sales->isEmpty()) {
            $this->command->info('⚠️  No sales without receipts found. Create sales first!');
            return;
        }

        $count = 0;
        foreach ($sales as $sale) {
            Receipt::create([
                'sale_id' => $sale->id,
                'receipt_number' => Receipt::generateReceiptNumber(),
                'printed_count' => rand(0, 2), // Random print count (0-2)
                'issued_at' => $sale->sale_datetime ?? Carbon::now(),
            ]);
            $count++;
        }
    }
}