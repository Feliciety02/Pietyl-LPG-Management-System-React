<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Repositories\CustomerRepository;
use App\Services\POS\POSProductService;
use App\Services\POS\POSSaleService;
use App\Services\SettingsService;
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
        ]);
    }

    public function store(Request $request)
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
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|exists:product_variants,id',
            'lines.*.qty' => 'required|numeric|min:1',
            'lines.*.mode' => 'required|in:refill,swap',
            'lines.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            $result = $this->posSaleService->processSale($validated, $user);

            return redirect()->back()->with('success', $result['message']);
            
        } catch (\Throwable $e) {
            Log::error('POSController: sale processing failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to process sale: ' . $e->getMessage());
        }
    }
}