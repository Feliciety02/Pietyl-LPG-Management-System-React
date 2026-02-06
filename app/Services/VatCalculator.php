<?php

namespace App\Services;

use InvalidArgumentException;

class VatCalculator
{
    public const TREATMENT_VATABLE = 'vatable_12';
    public const TREATMENT_ZERO_RATED = 'zero_rated_0';
    public const TREATMENT_EXEMPT = 'exempt';

    public const TREATMENTS = [
        self::TREATMENT_VATABLE,
        self::TREATMENT_ZERO_RATED,
        self::TREATMENT_EXEMPT,
    ];

    /**
     * @param float $amount Amount provided by the caller (gross when inclusive, net when exclusive)
     * @param float|null $rate VAT rate to apply (defaults to config if null)
     * @param bool $inclusive True when the amount already includes VAT
     * @param string $treatment VAT treatment code
     *
     * @return array{gross_amount: float, net_amount: float, vat_amount: float, rate_used: float, treatment: string, inclusive: bool}
     */
    public static function calculate(float $amount, ?float $rate, bool $inclusive, string $treatment): array
    {
        if (!in_array($treatment, self::TREATMENTS, true)) {
            throw new InvalidArgumentException("Unknown VAT treatment: {$treatment}");
        }

        $amount = max(0, $amount);
        $rateUsed = max(0, $rate ?? config('vat.default_rate', 0.12));
        $vatAmount = 0.0;
        $netAmount = 0.0;
        $grossAmount = 0.0;

        if ($treatment === self::TREATMENT_VATABLE && $rateUsed > 0) {
            if ($inclusive) {
                $vatAmount = $amount * $rateUsed / (1 + $rateUsed);
                $netAmount = $amount - $vatAmount;
                $grossAmount = $amount;
            } else {
                $netAmount = $amount;
                $vatAmount = $netAmount * $rateUsed;
                $grossAmount = $netAmount + $vatAmount;
            }
        } else {
            // Zero-rated or exempt: VAT is zero, net equals gross when inclusive, otherwise net equals amount
            $vatAmount = 0.0;
            $netAmount = $inclusive ? $amount : $amount;
            $grossAmount = $amount;
        }

        return [
            'gross_amount' => round($grossAmount, 2),
            'net_amount' => round($netAmount, 2),
            'vat_amount' => round($vatAmount, 2),
            'rate_used' => round($rateUsed, 4),
            'treatment' => $treatment,
            'inclusive' => $inclusive,
        ];
    }
}
