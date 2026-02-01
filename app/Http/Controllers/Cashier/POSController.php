<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\Receipt;
use App\Models\Delivery;
use App\Models\StockMovement;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\PaymentMethod;
use App\Models\Location;
use App\Models\InventoryBalance;
use App\Models\DailyClose;
use App\Services\Accounting\CostingService;
use App\Services\Accounting\LedgerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Carbon\Carbon;

class POSController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('cashier.pos.use')) {
            abort(403);
        }

        $variants = \App\Models\ProductVariant::with('product')
            ->where('is_active', 1) // 2026 standard ang 1
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

        $customers = \App\Models\Customer::select('id', 'name', 'phone')
            ->orderBy('name')
            ->get();
       
        return \Inertia\Inertia::render('CashierPage/POS', [
            'products' => $products,
            'customers' => $customers,
        ]);
    }

    /**
     * Process a new sale
     */
    public function store(Request $request, LedgerService $ledger, CostingService $costing)
    {
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
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|exists:product_variants,id',
            'lines.*.qty' => 'required|numeric|min:1',
            'lines.*.mode' => 'required|in:refill,swap',
            'lines.*.unit_price' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();

        try {
            // Calculate totals
            $subtotal = 0;
            foreach ($request->lines as $line) {
                $subtotal += $line['qty'] * $line['unit_price'];
            }

            $discount = 0;
            $tax = 0;
            $grandTotal = $subtotal - $discount + $tax;

            // Create sale
            $sale = Sale::create([
                'sale_number' => Sale::generateSaleNumber(),
                'sale_type' => $request->is_delivery ? 'delivery' : 'walkin',
                'customer_id' => $request->customer_id,
                'cashier_user_id' => auth()->id(),
                'status' => 'paid',
                'sale_datetime' => Carbon::now(),
                'subtotal' => $subtotal,
                'discount_total' => $discount,
                'tax_total' => $tax,
                'grand_total' => $grandTotal,
            ]);

            // Create sale items
            foreach ($request->lines as $line) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_variant_id' => $line['product_id'],
                    'qty' => $line['qty'],
                    'unit_price' => $line['unit_price'],
                    'line_total' => $line['qty'] * $line['unit_price'],
                    'pricing_source' => 'manual',
                ]);

                // Create stock movement (OUT)
                $location = Location::first(); // Get default location
                if ($location) {
                    StockMovement::create([
                        'location_id' => $location->id,
                        'product_variant_id' => $line['product_id'],
                        'movement_type' => StockMovement::TYPE_SALE_OUT,
                        'qty' => -$line['qty'], // Negative for OUT
                        'reference_type' => 'App\Models\Sale',
                        'reference_id' => $sale->id,
                        'performed_by_user_id' => auth()->id(),
                        'moved_at' => Carbon::now(),
                        'notes' => 'Sale via POS',
                    ]);

                    $balance = InventoryBalance::firstOrCreate(
                        [
                            'location_id' => $location->id,
                            'product_variant_id' => $line['product_id'],
                        ],
                        [
                            'qty_filled' => 0,
                            'qty_empty' => 0,
                            'qty_reserved' => 0,
                            'reorder_level' => 0,
                        ]
                    );

                    $balance->qty_filled = (int) $balance->qty_filled - (int) $line['qty'];
                    $balance->save();
                }
            }

            // Create payment
            $paymentMethod = PaymentMethod::where('method_key', $request->payment_method)->first();
            
            if ($paymentMethod) {
                Payment::create([
                    'sale_id' => $sale->id,
                    'payment_method_id' => $paymentMethod->id,
                    'amount' => $grandTotal,
                    'reference_no' => $request->payment_ref,
                    'received_by_user_id' => auth()->id(),
                    'paid_at' => Carbon::now(),
                ]);
            }

            // Post ledger entry
            $paymentKey = $request->payment_method;
            $salesLines = [];
            if ($paymentKey === 'cash') {
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
                $cogsTotal += ((float) $line['qty']) * $avgCost;
            }

            $cogsLines = [];
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

            // Create receipt
            Receipt::create([
                'sale_id' => $sale->id,
                'receipt_number' => Receipt::generateReceiptNumber(),
                'printed_count' => 0,
                'issued_at' => Carbon::now(),
            ]);

            // Create delivery if requested
            if ($request->is_delivery) {
                $customer = Customer::with('addresses')->find($request->customer_id);
                $defaultAddress = $customer->addresses()->where('is_default', 1)->first() 
                    ?? $customer->addresses()->first();

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

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to process sale: ' . $e->getMessage());
        }
    }
}
