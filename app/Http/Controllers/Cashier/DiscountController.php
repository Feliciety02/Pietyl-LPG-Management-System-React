<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Services\POS\DiscountService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DiscountController extends Controller
{
    public function __construct(
        private DiscountService $discountService
    ) {}

    public function validateCode(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('cashier.pos.use')) {
            abort(403);
        }

        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'kind' => 'required|string|in:promo,voucher',
        ]);

        try {
            $promo = $this->discountService->validatePromoCode(
                $validated['kind'],
                strtoupper(trim($validated['code'])),
                Carbon::now()
            );

            return response()->json([
                'id' => $promo->id,
                'code' => $promo->code,
                'name' => $promo->name,
                'kind' => $promo->kind,
                'discount_type' => $promo->discount_type,
                'value' => (float) $promo->value,
                'usage_limit' => $promo->usage_limit,
                'times_redeemed' => $promo->times_redeemed,
                'starts_at' => $promo->starts_at?->toDateString(),
                'expires_at' => $promo->expires_at?->toDateString(),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        }
    }
}
