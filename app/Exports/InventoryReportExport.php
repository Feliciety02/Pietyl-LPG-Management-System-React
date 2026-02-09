<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Illuminate\Support\Collection;

class InventoryReportExport implements WithMultipleSheets
{
    public function __construct(
        protected Collection $balances,
        protected Collection $movements,
        protected string $locationName,
        protected string $dateFrom,
        protected string $dateTo
    ) {}

    public function sheets(): array
    {
        $generatedDate = now()->format('Y-m-d H:i:s');

        return [
            new InventoryBalanceSheet($this->balances, $this->locationName, $generatedDate),
            new InventoryMovementSheet($this->movements, $this->dateFrom, $this->dateTo),
        ];
    }
}
