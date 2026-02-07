<?php

namespace App\Services\POS;

use Illuminate\Validation\ValidationException;

class PaymentProcessingService
{
    public function validateAndCalculateCash(string $paymentMethod, ?float $cashTendered, float $grandTotal): array
    {
        if ($paymentMethod !== 'cash') {
            return [
                'cash_tendered' => null,
                'cash_change' => null,
            ];
        }

        if ($cashTendered === null) {
            throw ValidationException::withMessages([
                'cash_tendered' => 'Amount received is required for cash payment.',
            ]);
        }

        $cashTendered = round($cashTendered, 2);
        $cashTendered = max(0, $cashTendered);

        if ($cashTendered < $grandTotal) {
            throw ValidationException::withMessages([
                'cash_tendered' => 'Amount received must be equal to or higher than the total.',
            ]);
        }

        $cashChange = round($cashTendered - $grandTotal, 2);
        $cashChange = max(0, $cashChange);

        return [
            'cash_tendered' => $cashTendered,
            'cash_change' => $cashChange,
        ];
    }

    public function validatePaymentReference(string $paymentMethod, ?string $paymentRef): void
    {
        $needsRef = in_array($paymentMethod, ['gcash', 'card'], true);

        if (!$needsRef) {
            return;
        }

        $ref = trim($paymentRef ?? '');
        
        if (mb_strlen($ref) < 4) {
            throw ValidationException::withMessages([
                'payment_ref' => 'Reference number is required for this payment method.',
            ]);
        }
    }

    public function getDebitAccount(string $paymentMethod): string
    {
        return $paymentMethod === 'cash' ? '2010' : '1020';
    }
}