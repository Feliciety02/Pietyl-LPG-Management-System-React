<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Repositories\CustomerRepository;
use App\Services\POS\POSProductService;
use App\Services\POS\POSSaleService;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        try {
            $result = $this->posSaleService->processSale($validated, $user);

            return redirect()->back()->with('success', $result['message']);
<<<<<<< HEAD

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
=======
        } catch (\InvalidArgumentException $e) {
            Log::warning('POSController: invalid sale input', [
                'user_id' => $user?->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->withErrors([
                'sale' => $e->getMessage(),
            ]);
        } catch (\RuntimeException $e) {
            Log::error('POSController: sale processing runtime error', [
                'user_id' => $user?->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->withErrors([
                'sale' => $e->getMessage(),
            ]);
        } catch (\Throwable $e) {
            Log::error('POSController: sale processing failed', [
                'user_id' => $user?->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->withErrors([
                'sale' => 'An unexpected error occurred. Please try again.',
            ]);
>>>>>>> e1b502a (white box)
        }
    }
}
