<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['code' => '1010', 'name' => 'Cash on Hand', 'account_type' => 'asset'],
            ['code' => '1020', 'name' => 'Cash in Bank', 'account_type' => 'asset'],
            ['code' => '1200', 'name' => 'Inventory', 'account_type' => 'asset'],
            ['code' => '2010', 'name' => 'Turnover Receivable', 'account_type' => 'asset'],
            ['code' => '2100', 'name' => 'Accounts Payable', 'account_type' => 'liability'],
            ['code' => '2030', 'name' => 'VAT Payable', 'account_type' => 'liability'],
            ['code' => '4010', 'name' => 'Sales Revenue', 'account_type' => 'revenue'],
            ['code' => '5000', 'name' => 'Cost of Goods Sold', 'account_type' => 'expense'],
            ['code' => '5100', 'name' => 'Cash Over/Short', 'account_type' => 'expense'],
            ['code' => '5200', 'name' => 'Loss Due to Damaged Inventory', 'account_type' => 'expense'],
        ];

        foreach ($accounts as $account) {
            ChartOfAccount::firstOrCreate(['code' => $account['code']], $account);
        }
    }
}
