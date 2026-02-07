<?php

namespace App\Repositories;

use App\Models\Payment;
use App\Models\PaymentMethod;

class PaymentRepository
{
    public function findPaymentMethodByKey(string $methodKey): ?PaymentMethod
    {
        return PaymentMethod::where('method_key', $methodKey)->first();
    }

    public function createPayment(array $data): Payment
    {
        return Payment::create($data);
    }
}