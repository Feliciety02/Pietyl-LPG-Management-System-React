<?php

namespace App\Services\POS;

use App\Models\AuditLog;
use App\Models\PromoRedemption;
use App\Models\PromoVoucher;
use App\Models\Sale;
use App\Models\User;
use App\Services\SettingsService;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class DiscountService
{
    public function __construct(
        private SettingsService $settingsService
    ) {}

    /**
     * @return array{total: float, items: array<int, array<string, mixed>>, subtotal: float}
     */
    public function validateDiscounts(array $payload, User $user, array $lines, Carbon $saleDate): array
    {
        $discounts = $payload['discounts'] ?? [];

        if (!is_array($discounts) || count($discounts) === 0) {
            return ['total' => 0.0, 'items' => [], 'subtotal' => $this->calculateSubtotal($lines)];
        }

        $subtotal = $this->calculateSubtotal($lines);
        if ($subtotal <= 0) {
            throw ValidationException::withMessages([
                'discounts' => 'Discounts cannot be applied without items in the cart.',
            ]);
        }

        $normalized = [];
        $seenCodes = [];
        $manualUsed = false;

        foreach ($discounts as $index => $raw) {
            if (!is_array($raw)) {
                throw ValidationException::withMessages([
                    'discounts' => 'Invalid discount payload.',
                ]);
            }

            $kind = $raw['kind'] ?? null;
            if (!in_array($kind, ['promo', 'voucher', 'manual'], true)) {
                throw ValidationException::withMessages([
                    'discounts' => 'Invalid discount type.',
                ]);
            }

            if ($kind === 'manual') {
                $manualUsed = true;
                $discountType = $raw['discount_type'] ?? 'amount';
                if (!in_array($discountType, ['amount', 'percent'], true)) {
                    $discountType = 'amount';
                }

                $value = (float) ($raw['value'] ?? 0);
                if (!is_finite($value) || $value <= 0) {
                    throw ValidationException::withMessages([
                        'discounts' => 'Manual discount value is required.',
                    ]);
                }

                if ($discountType === 'percent') {
                    $value = min(100, max(0, $value));
                }

                $amount = $discountType === 'percent'
                    ? $subtotal * ($value / 100)
                    : $value;

                $normalized[] = [
                    'kind' => 'manual',
                    'code' => trim((string) ($raw['code'] ?? '')),
                    'discount_type' => $discountType,
                    'value' => round($value, 2),
                    'amount' => round(max(0, $amount), 2),
                ];

                continue;
            }

            $code = strtoupper(trim((string) ($raw['code'] ?? '')));
            if ($code === '') {
                throw ValidationException::withMessages([
                    'discounts' => 'Promo or voucher code is required.',
                ]);
            }

            if (isset($seenCodes[$code])) {
                throw ValidationException::withMessages([
                    'discounts' => "Code {$code} is already applied.",
                ]);
            }
            $seenCodes[$code] = true;

            $promo = $this->validatePromoCode($kind, $code, $saleDate);

            $amount = $promo->discount_type === 'percent'
                ? $subtotal * ((float) $promo->value / 100)
                : (float) $promo->value;

            $normalized[] = [
                'kind' => $promo->kind,
                'promo_id' => $promo->id,
                'code' => $promo->code,
                'name' => $promo->name,
                'discount_type' => $promo->discount_type,
                'value' => (float) $promo->value,
                'amount' => round(max(0, $amount), 2),
            ];
        }

        if ($manualUsed && !$this->settingsService->verifyManagerPin($payload['manager_pin'] ?? null)) {
            throw ValidationException::withMessages([
                'manager_pin' => 'Invalid manager PIN for manual discounts.',
            ]);
        }

        $total = array_reduce($normalized, fn ($sum, $item) => $sum + (float) ($item['amount'] ?? 0), 0.0);
        $total = min($subtotal, $total);

        return [
            'total' => round($total, 2),
            'items' => $normalized,
            'subtotal' => $subtotal,
        ];
    }

    public function validatePromoCode(string $kind, string $code, Carbon $saleDate): PromoVoucher
    {
        $promo = PromoVoucher::where('code', $code)->first();

        if (!$promo || !$promo->isActiveForDate($saleDate)) {
            throw ValidationException::withMessages([
                'code' => "Code {$code} is not active.",
            ]);
        }

        if ($promo->kind !== $kind) {
            throw ValidationException::withMessages([
                'code' => "Code {$code} is not a {$kind}.",
            ]);
        }

        if ($promo->usage_limit !== null && $promo->times_redeemed >= $promo->usage_limit) {
            throw ValidationException::withMessages([
                'code' => "Code {$code} has reached its usage limit.",
            ]);
        }

        return $promo;
    }

    public function recordDiscounts(Sale $sale, array $items, User $user, Carbon $saleDate): void
    {
        if (empty($items)) {
            return;
        }

        $request = request();

        foreach ($items as $item) {
            $kind = $item['kind'] ?? null;

            if ($kind === 'manual') {
                AuditLog::create([
                    'actor_user_id' => $user->id,
                    'action' => 'sale.manual_discount',
                    'entity_type' => 'Sale',
                    'entity_id' => $sale->id,
                    'message' => "Manual discount applied to Sale #{$sale->sale_number}",
                    'before_json' => null,
                    'after_json' => [
                        'discount_type' => $item['discount_type'] ?? 'amount',
                        'value' => $item['value'] ?? 0,
                        'amount' => $item['amount'] ?? 0,
                        'label' => $item['code'] ?? null,
                    ],
                    'ip_address' => $request?->ip(),
                    'user_agent' => $request?->userAgent(),
                ]);

                continue;
            }

            $promoId = $item['promo_id'] ?? null;
            if (!$promoId) {
                continue;
            }

            $promo = PromoVoucher::where('id', $promoId)->lockForUpdate()->first();
            if (!$promo || !$promo->isActiveForDate($saleDate)) {
                throw ValidationException::withMessages([
                    'discounts' => 'A promo or voucher was invalidated before checkout.',
                ]);
            }

            if ($promo->usage_limit !== null && $promo->times_redeemed >= $promo->usage_limit) {
                throw ValidationException::withMessages([
                    'discounts' => "Code {$promo->code} reached its usage limit.",
                ]);
            }

            $promo->increment('times_redeemed');

            PromoRedemption::create([
                'promo_voucher_id' => $promo->id,
                'sale_id' => $sale->id,
                'cashier_user_id' => $user->id,
                'discount_amount' => (float) ($item['amount'] ?? 0),
                'redeemed_at' => $saleDate,
            ]);
        }
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
}
