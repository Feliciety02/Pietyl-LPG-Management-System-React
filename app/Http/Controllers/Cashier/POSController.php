<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
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
use App\Services\SettingsService;
use App\Services\VatCalculator;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use App\Models\StockMovement;
use App\Models\InventoryBalance;  
use Illuminate\Validation\ValidationException;
use Throwable;

class POSController extends Controller
{
    public function index(Request $request, SettingsService $settings)
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

        $inventory_balance = DB::table('inventory_balances')
            ->whereIn('product_variant_id', $variants->pluck('id'))
            ->select('product_variant_id', DB::raw('SUM(CAST(qty_filled AS UNSIGNED)) as total_qty_filled'))
            ->groupBy('product_variant_id')
            ->pluck('total_qty_filled', 'product_variant_id')
            ->map(fn($qty) => (int) $qty)
            ->toArray();

         
        $products = $variants->map(function ($variant) use ($priceListPrices, $inventory_balance) {
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
                'stock_qty'    => $inventory_balance[$variant->id] ?? 0,
            ];
        });


        $customers = Customer::select('id', 'name', 'phone')
            ->orderBy('name')
            ->get();
        
        return \Inertia\Inertia::render('CashierPage/POS', [
            'products' => $products,
            'customers' => $customers,
            'vat_settings' => $settings->getVatSnapshot(),
        ]);
    }

    public function store(Request $request, LedgerService $ledger, CostingService $costing, SettingsService $settings)
    {

        
        $user = $request->user();
        if (!$user || !$user->can('cashier.sales.create')) {
            abort(403);
        }

        if (DailyClose::where('business_date', now()->toDateString())->exists()) {
            throw ValidationException::withMessages([
                'locked' => 'Sales are locked for this business date.',
            ]);
        }

        $request->validate([
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

        DB::beginTransaction();

        $sale = null;

        try {
            Log::info('POS store: start', [
                'user_id' => $user->id,
                'customer_id' => $request->customer_id,
                'is_delivery' => (bool) $request->is_delivery,
                'payment_method' => $paymentMethodKey,
                'lines_count' => is_array($request->lines) ? count($request->lines) : 0,
            ]);

            $subtotal = 0.0;
            foreach ($request->lines as $i => $line) {
                Log::info('POS store: line', [
                    'i' => $i,
                    'product_id' => $line['product_id'] ?? null,
                    'qty' => $line['qty'] ?? null,
                    'unit_price' => $line['unit_price'] ?? null,
                    'mode' => $line['mode'] ?? null,
                ]);

                $qty = (float) ($line['qty'] ?? 0);
                $unitPrice = (float) ($line['unit_price'] ?? 0);
                $subtotal += ($qty * $unitPrice);
            }

            $discount = 0.0;
            $saleDate = Carbon::now();
            $vatSettings = $settings->getSettings();
            $vatApplicable = $settings->isVatActiveForDate($saleDate);
            $requestedTreatment = $request->input('vat_treatment', VatCalculator::TREATMENT_VATABLE);
            $vatTreatment = $vatApplicable
                ? (in_array($requestedTreatment, VatCalculator::TREATMENTS, true) ? $requestedTreatment : VatCalculator::TREATMENT_VATABLE)
                : VatCalculator::TREATMENT_EXEMPT;
            $vatMode = $vatSettings->vat_mode ?? 'inclusive';
            $vatInclusive = $vatMode === 'inclusive'
                ? true
                : filter_var(
                    $request->input('vat_inclusive', config('vat.default_inclusive', true)),
                    FILTER_VALIDATE_BOOLEAN
                );
            $vatRate = $vatApplicable
                ? ($request->filled('vat_rate') ? max(0, (float) $request->input('vat_rate')) : $vatSettings->vat_rate)
                : 0.0;

            $vatResult = VatCalculator::calculate($subtotal, $vatRate, $vatInclusive, $vatTreatment);
            $vatAmount = $vatResult['vat_amount'];
            $netAmount = $vatResult['net_amount'];
            $grossAmount = $vatResult['gross_amount'];
            $tax = $vatAmount;
            $grandTotal = $grossAmount;
            $vatApplied = $vatApplicable && $vatTreatment === VatCalculator::TREATMENT_VATABLE && $vatAmount > 0;

            Log::info('POS store: totals computed', [
                'subtotal' => $subtotal,
                'discount' => $discount,
                'vat_amount' => $vatAmount,
                'net_amount' => $netAmount,
                'gross_amount' => $grossAmount,
            ]);

            $cashTendered = null;
            $cashChange = null;

            if ($paymentMethodKey === 'cash') {
                if (!$request->has('cash_tendered') || $request->cash_tendered === null || $request->cash_tendered === '') {
                    throw ValidationException::withMessages([
                        'cash_tendered' => 'Amount received is required for cash payment.',
                    ]);
                }

                $cashTendered = round((float) $request->cash_tendered, 2);
                if ($cashTendered < 0) {
                    $cashTendered = 0;
                }

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
                'sale_type' => $request->is_delivery ? 'delivery' : 'walkin',
                'customer_id' => $request->customer_id,
                'cashier_user_id' => $user->id,
                'status' => 'paid',
                'sale_datetime' => $saleDate,
                'subtotal' => $subtotal,
                'discount_total' => $discount,
                'tax_total' => $tax,
                'grand_total' => $grandTotal,
                'vat_treatment' => $vatResult['treatment'],
                'vat_rate' => $vatResult['rate_used'],
                'vat_inclusive' => $vatResult['inclusive'],
                'vat_amount' => $vatAmount,
                'net_amount' => $netAmount,
                'gross_amount' => $grossAmount,
                'vat_applied' => $vatApplied,
            ];

            if (Schema::hasColumn('sales', 'cash_tendered')) {
                $salePayload['cash_tendered'] = $cashTendered;
            }
            if (Schema::hasColumn('sales', 'cash_change')) {
                $salePayload['cash_change'] = $cashChange;
            }

            $sale = Sale::create($salePayload);

            Log::info('POS store: sale created', [
                'sale_id' => $sale->id,
                'sale_number' => $sale->sale_number,
                'cash_tendered' => $cashTendered,
                'cash_change' => $cashChange,
            ]);

            foreach ($request->lines as $i => $line) {
                $qty = (float) $line['qty'];
                $unitPrice = (float) $line['unit_price'];

                $lineAmount = $qty * $unitPrice;
                $lineVat = VatCalculator::calculate($lineAmount, $vatRate, $vatInclusive, $vatTreatment);

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_variant_id' => $line['product_id'],
                    'qty' => $qty,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineAmount,
                    'line_net_amount' => $lineVat['net_amount'],
                    'line_vat_amount' => $lineVat['vat_amount'],
                    'line_gross_amount' => $lineVat['gross_amount'],
                    'pricing_source' => 'manual',
                ]);

                $location = Location::first();
                if (!$location) {
                    Log::warning('POS store: no location found, skipping stock movement', [
                        'sale_id' => $sale->id,
                        'product_variant_id' => $line['product_id'],
                    ]);
                } else {
                    StockMovement::create([
                        'location_id' => $location->id,
                        'product_variant_id' => $line['product_id'],
                        'movement_type' => StockMovement::TYPE_SALE_OUT,
                        'qty' => -$qty,
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'performed_by_user_id' => $user->id,
                        'moved_at' => Carbon::now(),
                        'notes' => 'Sale via POS',
                    ]);

                    $balance = InventoryBalance::where('location_id', $location->id)
                        ->where('product_variant_id', $line['product_id'])
                        ->first();

                    if (!$balance) {
                        Log::warning('POS store: InventoryBalance missing, creating placeholder record', [
                            'location_id' => $location->id,
                            'product_variant_id' => $line['product_id'],
                        ]);

                        $balance = InventoryBalance::create([
                            'location_id' => $location->id,
                            'product_variant_id' => $line['product_id'],
                            'qty_filled' => 0,
                            'qty_empty' => 0,
                            'qty_reserved' => 0,
                        ]);
                    }

                    $newFilled = max(0, (int) $balance->qty_filled - (int) $qty);
                    $balance->qty_filled = $newFilled;
                    $balance->qty_empty = $balance->qty_empty + (int) $qty;
                    $balance->save();
                }
            }

            $paymentMethod = PaymentMethod::where('method_key', $paymentMethodKey)->first();
            if (!$paymentMethod) {
                Log::warning('POS store: payment method not found', [
                    'sale_id' => $sale->id,
                    'method_key' => $paymentMethodKey,
                ]);
            } else {
                Payment::create([
                    'sale_id' => $sale->id,
                    'payment_method_id' => $paymentMethod->id,
                    'amount' => $grossAmount,
                    'reference_no' => $needsRef ? trim((string) $request->payment_ref) : null,
                    'received_by_user_id' => $user->id,
                    'paid_at' => Carbon::now(),
                ]);
            }

            $salesLines = [];
            $cogsLines = [];
            $debitAccount = $paymentMethodKey === 'cash' ? '2010' : '1020';

            $salesLines[] = [
                'account_code' => $debitAccount,
                'debit' => $grossAmount,
                'credit' => 0,
                'description' => $paymentMethodKey === 'cash'
                    ? 'Cash sales recorded as turnover receivable'
                    : 'Non-cash sales received in bank',
            ];

            $salesLines[] = [
                'account_code' => '4010',
                'debit' => 0,
                'credit' => $vatAmount > 0 ? $netAmount : $grossAmount,
                'description' => $vatAmount > 0
                    ? 'Recognize sales revenue (net)'
                    : 'Recognize sales revenue',
            ];

            if ($vatAmount > 0) {
                $salesLines[] = [
                    'account_code' => '2030',
                    'debit' => 0,
                    'credit' => $vatAmount,
                    'description' => 'VAT payable',
                ];
            }

            $cogsTotal = 0.0;
            foreach ($request->lines as $i => $line) {
                $avgCost = $costing->getWeightedAverageCost((int) $line['product_id'], Carbon::now());

                Log::info('POS store: avg cost computed', [
                    'sale_id' => $sale->id,
                    'i' => $i,
                    'product_id' => $line['product_id'],
                    'avg_cost' => $avgCost,
                ]);

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

            Log::info('POS store: before ledger post', [
                'sale_id' => $sale->id,
                'sales_lines' => count($salesLines),
                'cogs_lines' => count($cogsLines),
            ]);

            $ledger->postEntry([
                'entry_date' => Carbon::now()->toDateString(),
                'reference_type' => 'sale',
                'reference_id' => $sale->id,
                'created_by_user_id' => $user->id,
                'memo' => "Sale {$sale->sale_number}",
                'lines' => array_merge($salesLines, $cogsLines),
            ]);

            Log::info('POS store: after ledger post', ['sale_id' => $sale->id]);

            Receipt::create([
                'sale_id' => $sale->id,
                'receipt_number' => Receipt::generateReceiptNumber(),
                'printed_count' => 0,
                'issued_at' => Carbon::now(),
            ]);

            if ($request->is_delivery) {
                $customer = Customer::with('addresses')->find($request->customer_id);

                $defaultAddress = null;
                if ($customer) {
                    $defaultAddress = $customer->addresses()
                        ->where('is_default', 1)
                        ->first()
                        ?? $customer->addresses()->first();
                }

                if ($defaultAddress) {
                    // Find rider with least active deliveries
                    $riders = User::whereHas('roles', function($q) {
                        $q->where('name', 'rider');
                    })->get();

                    $selectedRiderId = null;

                    if ($riders->isNotEmpty()) {
                        $riderWorkload = [];
                        foreach ($riders as $rider) {
                            $activeCount = Delivery::where('assigned_rider_user_id', $rider->id)
                                ->whereIn('status', [
                                    Delivery::STATUS_PENDING,
                                    Delivery::STATUS_ASSIGNED,
                                    Delivery::STATUS_IN_TRANSIT,
                                ])
                                ->count();
                            
                            $riderWorkload[] = [
                                'id' => $rider->id,
                                'count' => $activeCount,
                            ];
                        }

                        usort($riderWorkload, function($a, $b) {
                            if ($a['count'] === $b['count']) {
                                return $a['id'] <=> $b['id'];
                            }
                            return $a['count'] <=> $b['count'];
                        });

                        $selectedRiderId = $riderWorkload[0]['id'] ?? null;
                    }

                    Delivery::create([
                        'delivery_number' => Delivery::generateDeliveryNumber(),
                        'sale_id' => $sale->id,
                        'customer_id' => $request->customer_id,
                        'address_id' => $defaultAddress->id,
                        'assigned_rider_user_id' => $selectedRiderId,
                        'status' => $selectedRiderId ? Delivery::STATUS_ASSIGNED : Delivery::STATUS_PENDING,
                        'scheduled_at' => Carbon::now()->addHours(2),
                    ]);
                } else {
                    Log::warning('POS store: no address found, skipping delivery', [
                        'sale_id' => $sale->id,
                        'customer_id' => $request->customer_id,
                    ]);
                }
            }

            DB::commit();

            Log::info('POS store: committed', [
                'sale_id' => $sale->id,
                'sale_number' => $sale->sale_number,
            ]);

            return redirect()->back()->with('success', 'Sale completed successfully!');
        } catch (Throwable $e) {
            DB::rollBack();

            Log::error('POS store: FAILED and rolled back', [
                'sale_id' => $sale?->id,
                'sale_number' => $sale?->sale_number,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => substr($e->getTraceAsString(), 0, 2000),
            ]);

            return redirect()->back()->with('error', 'Failed to process sale: ' . $e->getMessage());
        }

    }

    public function deductOne(Location $location, ProductVariant $variant, int $qty = 1): void
    {
        $balance = InventoryBalance::where('location_id', $location->id)
            ->where('product_variant_id', $variant->id)
            ->first();

        if ($balance) {
            $balance->qty_filled = (int) $balance->qty_filled - $qty;
            $balance->save();
        }
    }
}
