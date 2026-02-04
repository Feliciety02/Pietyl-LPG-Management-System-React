<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\DailyClose;
use App\Models\Delivery;
use App\Models\Location;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Receipt;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\Accounting\CostingService;
use App\Services\Accounting\LedgerService;
use App\Services\InventoryService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Throwable;

class POSController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('cashier.pos.use')) {
            abort(403);
        }

        $variants = \App\Models\ProductVariant::with('product')
            ->where('is_active', 1)
            ->whereHas('product', function ($q) {
                $q->where('is_active', true);
            })
            ->get();

        $priceListPrices = [];
        if (Schema::hasTable('price_lists') && Schema::hasTable('price_list_items') && $variants->isNotEmpty()) {
            $priceListId = DB::table('price_lists')
                ->where('is_active', 1)
                ->orderByDesc('starts_at')
                ->orderByDesc('created_at')
                ->value('id');

            if ($priceListId) {
                $priceListPrices = DB::table('price_list_items')
                    ->where('price_list_id', $priceListId)
                    ->whereIn('product_variant_id', $variants->pluck('id'))
                    ->pluck('price', 'product_variant_id')
                    ->toArray();
            }
        }

        $products = $variants->map(function ($variant) use ($priceListPrices) {
            $basePrice = $variant->product?->price ?? 0;
            if (isset($priceListPrices[$variant->id])) {
                $basePrice = $priceListPrices[$variant->id];
            }
            $basePrice = (float) $basePrice;

            return [
                'id'           => $variant->id,
                'name'         => $variant->product->name ?? 'Unknown',
                'variant'      => $variant->variant_name,
                'category'     => $variant->product->category ?? 'lpg',
                'price_refill' => $basePrice,
                'price_swap'   => $basePrice * 1.25,
            ];
        });

        $customers = Customer::select('id', 'name', 'phone')
            ->orderBy('name')
            ->get();

        return \Inertia\Inertia::render('CashierPage/POS', [
            'products' => $products,
            'customers' => $customers,
        ]);
    }

    public function store(
        Request $request,
        LedgerService $ledger,
        CostingService $costing,
        InventoryService $inventory
    ) {
        $user = $request->user();
        if (!$user || !$user->can('cashier.sales.create')) {
            abort(403);
        }

        if (DailyClose::where('business_date', now()->toDateString())->exists()) {
            return redirect()->back()->with('error', 'Sales are locked for this business date.');
        }

        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'is_delivery' => 'boolean',
            'payment_method' => 'required|in:cash,gcash,card',
            'payment_ref' => 'nullable|string',
            'cash_tendered' => 'nullable|numeric|min:0',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|exists:product_variants,id',
            'lines.*.qty' => 'required|numeric|min:1',
            'lines.*.mode' => 'required|in:refill,swap',
            'lines.*.unit_price' => 'required|numeric|min:0',
        ]);

        $paymentMethodKey = (string) $request->payment_method;
        $needsRef = in_array($paymentMethodKey, ['gcash', 'card'], true);

        if ($needsRef) {
            $ref = trim((string) $request->payment_ref);
            if (mb_strlen($ref) < 4) {
                throw ValidationException::withMessages([
                    'payment_ref' => 'Reference number is required for this payment method.',
                ]);
            }
        }

        $sale = null;

        try {
            DB::beginTransaction();

            $isDelivery = (bool) $request->is_delivery;

            $subtotal = 0.0;
            foreach ($request->lines as $line) {
                $qty = (float) ($line['qty'] ?? 0);
                $unitPrice = (float) ($line['unit_price'] ?? 0);
                $subtotal += ($qty * $unitPrice);
            }

            $discount = 0.0;
            $tax = 0.0;
            $grandTotal = round($subtotal - $discount + $tax, 2);

            $cashTendered = null;
            $cashChange = null;

            if ($paymentMethodKey === 'cash') {
                if (!$request->has('cash_tendered') || $request->cash_tendered === null || $request->cash_tendered === '') {
                    throw ValidationException::withMessages([
                        'cash_tendered' => 'Amount received is required for cash payment.',
                    ]);
                }

                $cashTendered = round((float) $request->cash_tendered, 2);

                if ($cashTendered < $grandTotal) {
                    throw ValidationException::withMessages([
                        'cash_tendered' => 'Amount received must be equal to or higher than the total.',
                    ]);
                }

                $cashChange = round($cashTendered - $grandTotal, 2);
                if ($cashChange < 0) {
                    $cashChange = 0;
                }
            }

            $salePayload = [
                'sale_number' => Sale::generateSaleNumber(),
                'sale_type' => $isDelivery ? 'delivery' : 'walkin',
                'customer_id' => $request->customer_id,
                'cashier_user_id' => $user->id,
                'status' => 'paid',
                'sale_datetime' => Carbon::now(),
                'subtotal' => $subtotal,
                'discount_total' => $discount,
                'tax_total' => $tax,
                'grand_total' => $grandTotal,
            ];

            if (Schema::hasColumn('sales', 'cash_tendered')) {
                $salePayload['cash_tendered'] = $cashTendered;
            }
            if (Schema::hasColumn('sales', 'cash_change')) {
                $salePayload['cash_change'] = $cashChange;
            }

            $sale = Sale::create($salePayload);

            $location = Location::query()->orderBy('id')->first();
            if (!$location) {
                throw ValidationException::withMessages([
                    'location' => 'No location found. Please create at least one location before selling.',
                ]);
            }

            foreach ($request->lines as $line) {
                $qty = (float) $line['qty'];
                $unitPrice = (float) $line['unit_price'];
                $variantId = (int) $line['product_id'];
                $mode = (string) ($line['mode'] ?? 'refill');

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_variant_id' => $variantId,
                    'qty' => $qty,
                    'unit_price' => $unitPrice,
                    'line_total' => $qty * $unitPrice,
                    'pricing_source' => 'manual',
                ]);

                if (!$isDelivery) {
                    $inventory->stockOutFromPOS(
                        productVariantId: $variantId,
                        locationId: (int) $location->id,
                        qty: (int) $qty,
                        userId: (int) $user->id,
                        mode: $mode,
                        referenceType: 'sale',
                        referenceId: (string) $sale->id
                    );
                }
            }

            $paymentMethod = PaymentMethod::where('method_key', $paymentMethodKey)->first();
            if ($paymentMethod) {
                Payment::create([
                    'sale_id' => $sale->id,
                    'payment_method_id' => $paymentMethod->id,
                    'amount' => $grandTotal,
                    'reference_no' => $needsRef ? trim((string) $request->payment_ref) : null,
                    'received_by_user_id' => $user->id,
                    'paid_at' => Carbon::now(),
                ]);
            }

            $salesLines = [];
            $cogsLines = [];

            if ($paymentMethodKey === 'cash') {
                $salesLines[] = [
                    'account_code' => '2010',
                    'debit' => $grandTotal,
                    'credit' => 0,
                    'description' => 'Cash sales recorded as turnover receivable',
                ];
            } else {
                $salesLines[] = [
                    'account_code' => '1020',
                    'debit' => $grandTotal,
                    'credit' => 0,
                    'description' => 'Non-cash sales received in bank',
                ];
            }

            $salesLines[] = [
                'account_code' => '4010',
                'debit' => 0,
                'credit' => $grandTotal,
                'description' => 'Recognize sales revenue',
            ];

            $cogsTotal = 0.0;
            foreach ($request->lines as $line) {
                $avgCost = $costing->getWeightedAverageCost((int) $line['product_id'], Carbon::now());
                $cogsTotal += ((float) $line['qty']) * ((float) $avgCost);
            }

            if ($cogsTotal > 0) {
                $cogsLines[] = [
                    'account_code' => '5000',
                    'debit' => $cogsTotal,
                    'credit' => 0,
                    'description' => 'Record cost of goods sold',
                ];
                $cogsLines[] = [
                    'account_code' => '1200',
                    'debit' => 0,
                    'credit' => $cogsTotal,
                    'description' => 'Reduce inventory',
                ];
            }

            $ledger->postEntry([
                'entry_date' => Carbon::now()->toDateString(),
                'reference_type' => 'sale',
                'reference_id' => $sale->id,
                'created_by_user_id' => $user->id,
                'memo' => "Sale {$sale->sale_number}",
                'lines' => array_merge($salesLines, $cogsLines),
            ]);

            Receipt::create([
                'sale_id' => $sale->id,
                'receipt_number' => Receipt::generateReceiptNumber(),
                'printed_count' => 0,
                'issued_at' => Carbon::now(),
            ]);

            if ($isDelivery) {
                $customer = Customer::with('addresses')->find($request->customer_id);

                $defaultAddress = null;
                if ($customer) {
                    $defaultAddress = $customer->addresses()
                        ->where('is_default', 1)
                        ->first()
                        ?? $customer->addresses()->first();
                }

                if ($defaultAddress) {
                    Delivery::create([
                        'delivery_number' => Delivery::generateDeliveryNumber(),
                        'sale_id' => $sale->id,
                        'customer_id' => $request->customer_id,
                        'address_id' => $defaultAddress->id,
                        'status' => Delivery::STATUS_PENDING,
                        'scheduled_at' => Carbon::now()->addHours(2),
                    ]);
                }
            }

            DB::commit();

            return redirect()->back()->with('success', 'Sale completed successfully!');
        } catch (Throwable $e) {
            DB::rollBack();

            Log::error('POS store: FAILED', [
                'sale_id' => $sale?->id,
                'sale_number' => $sale?->sale_number,
                'message' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to process sale: ' . $e->getMessage());
        }
    }
}
