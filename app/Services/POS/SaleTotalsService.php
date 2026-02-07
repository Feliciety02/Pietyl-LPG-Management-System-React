<?php

namespace App\Services\POS;

use App\Services\SettingsService;
use App\Services\VatCalculator;
use Carbon\Carbon;

class SaleTotalsService
{
    public function __construct(
        private SettingsService $settingsService
    ) {}

    public function calculateTotals(array $lines, array $requestData, Carbon $saleDate): array
    {
        $subtotal = $this->calculateSubtotal($lines);
        $discount = 0.0;

        $vatSettings = $this->settingsService->getSettings();
        $vatApplicable = $this->settingsService->isVatActiveForDate($saleDate);
        
        $vatTreatment = $this->determineVatTreatment($vatApplicable, $requestData['vat_treatment'] ?? null);
        $vatInclusive = $this->determineVatInclusive($vatSettings, $requestData['vat_inclusive'] ?? null);
        $vatRate = $this->determineVatRate($vatApplicable, $vatSettings, $requestData['vat_rate'] ?? null);

        $vatResult = VatCalculator::calculate($subtotal, $vatRate, $vatInclusive, $vatTreatment);
        
        $vatApplied = $vatApplicable 
            && $vatTreatment === VatCalculator::TREATMENT_VATABLE 
            && $vatResult['vat_amount'] > 0;

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'vat_amount' => $vatResult['vat_amount'],
            'net_amount' => $vatResult['net_amount'],
            'gross_amount' => $vatResult['gross_amount'],
            'tax' => $vatResult['vat_amount'],
            'grand_total' => $vatResult['gross_amount'],
            'vat_applied' => $vatApplied,
            'vat_result' => $vatResult,
            'vat_rate' => $vatRate,
            'vat_inclusive' => $vatInclusive,
            'vat_treatment' => $vatTreatment,
        ];
    }

    public function calculateLineVat(float $lineAmount, float $vatRate, bool $vatInclusive, string $vatTreatment): array
    {
        return VatCalculator::calculate($lineAmount, $vatRate, $vatInclusive, $vatTreatment);
    }

    private function calculateSubtotal(array $lines): float
    {
        $subtotal = 0.0;
        
        foreach ($lines as $line) {
            $qty = (float) ($line['qty'] ?? 0);
            $unitPrice = (float) ($line['unit_price'] ?? 0);
            $subtotal += ($qty * $unitPrice);
        }

        return $subtotal;
    }

    private function determineVatTreatment(bool $vatApplicable, ?string $requestedTreatment): string
    {
        if (!$vatApplicable) {
            return VatCalculator::TREATMENT_EXEMPT;
        }

        if ($requestedTreatment && in_array($requestedTreatment, VatCalculator::TREATMENTS, true)) {
            return $requestedTreatment;
        }

        return VatCalculator::TREATMENT_VATABLE;
    }

    private function determineVatInclusive($vatSettings, ?bool $requestVatInclusive): bool
    {
        $vatMode = $vatSettings->vat_mode ?? 'inclusive';
        
        if ($vatMode === 'inclusive') {
            return true;
        }

        if ($requestVatInclusive !== null) {
            return filter_var($requestVatInclusive, FILTER_VALIDATE_BOOLEAN);
        }

        return config('vat.default_inclusive', true);
    }

    private function determineVatRate(bool $vatApplicable, $vatSettings, ?float $requestVatRate): float
    {
        if (!$vatApplicable) {
            return 0.0;
        }

        if ($requestVatRate !== null) {
            return max(0, $requestVatRate);
        }

        return $vatSettings->vat_rate ?? 0.0;
    }
}