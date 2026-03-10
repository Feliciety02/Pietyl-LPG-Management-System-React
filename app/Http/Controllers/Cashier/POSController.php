<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Repositories\CustomerRepository;
use App\Services\POS\POSProductService;
use App\Services\POS\POSSaleService;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class POSController extends Controller
{
    public function __construct(
        private POSProductService $posProductService,
        private POSSaleService $posSaleService,
        private CustomerRepository $customerRepository,
        private SettingsService $settingsService
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        
        if (!$user || !$user->can('cashier.pos.use')) {
            abort(403);
        }

        $products = $this->posProductService->getProductsForPOS();
        $customers = $this->customerRepository->getAllCustomers();

        return \Inertia\Inertia::render('CashierPage/POS', [
            'products' => $products,
            'customers' => $customers,
            'vat_settings' => $this->settingsService->getVatSnapshot(),
            'discount_settings' => $this->settingsService->getDiscountSnapshot(),
        ]);
    }


    public function store(Request $request): RedirectResponse
    {
        return $this->storeDataPos($request);
    }


    public function storeDataPos(Request $request): RedirectResponse
    {
        $user = $request->user();
        
        if (!$user || !$user->can('cashier.sales.create')) {
            abort(403);
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'is_delivery' => 'boolean',
            'payment_method' => 'required|in:cash,gcash,card',
            'payment_ref' => 'nullable|string',
            'vat_treatment' => ['required', 'in:vatable_12,zero_rated_0,exempt'],
            'vat_inclusive' => 'required|boolean',
            'vat_rate' => 'nullable|numeric|min:0',
            'cash_tendered' => 'nullable|numeric|min:0',
            'discount_total' => 'nullable|numeric|min:0',
            'manager_pin' => 'nullable|string',
            'discounts' => 'nullable|array',
            'discounts.*.kind' => 'required_with:discounts|string|in:promo,voucher,manual',
            'discounts.*.code' => 'nullable|string|max:50',
            'discounts.*.value' => 'nullable|numeric|min:0',
            'discounts.*.discount_type' => 'nullable|string|in:percent,amount',
            'discounts.*.promo_id' => 'nullable|integer',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|exists:product_variants,id',
            'lines.*.qty' => 'required|numeric|min:1',
            'lines.*.mode' => 'required|in:refill,swap',
            'lines.*.unit_price' => 'required|numeric|min:0',
        ]);

        // a unique lock key based on the cashier's user ID so that
        // if the same cashier double-clicks or submits twice, the second request
        // is blocked until the first one finishes. Uses Laravel's Cache lock —
        // no DB changes needed. Lock auto-releases after 30s as a safety net.
        $lockKey = 'pos_sale_user_' . $user->id;
        $lock = Cache::lock($lockKey, 30);

        if (!$lock->get()) {
            return back()->withErrors(['sale' => 'A sale is already being processed. Please wait.']);
        }

        try {
            $result = $this->posSaleService->processSale($validated, $user);

            return redirect()->back()->with('success', $result['message']);

        } catch (\InvalidArgumentException $e) {
            Log::warning('POSController: invalid sale data', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['sale' => $e->getMessage()]);

        } catch (\RuntimeException $e) {
            Log::error('POSController: sale processing failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['sale' => $e->getMessage()]);

        } catch (\Throwable $e) {
            Log::error('POSController: unexpected error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['sale' => 'An unexpected error occurred. Please try again.']);

        } finally {
            // Always release the lock when done, whether it succeeded or failed
            $lock->release();
        }
    }
}
