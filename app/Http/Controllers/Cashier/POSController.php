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
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class POSController extends Controller
{
    public function index()
    {
        $activePriceList = \App\Models\PriceList::with('priceListItems')
            ->where('is_active', true)
            ->latest('starts_at')
            ->first();

        $products = \App\Models\ProductVariant::with('product')
            ->where('is_active', 1) // 2026 standard ang 1
            ->get()
            ->map(function ($variant) use ($activePriceList) {
                $priceItem = $activePriceList
                    ? $activePriceList->priceListItems->firstWhere('product_variant_id', $variant->id)
                    : null;

                $basePrice = $priceItem?->price ?? 0;

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
    public function store(Request $request)
    {
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

            $user = auth()->user();
            if ($user) {
                AuditLog::create([
                    'actor_user_id' => $user->id,
                    'action' => 'sale.create',
                    'entity_type' => 'Sale',
                    'entity_id' => $sale->id,
                    'message' => 'Recorded a sale (' . ($request->is_delivery ? 'delivery' : 'walk in') . ')',
                    'after_json' => [
                        'sale_number' => $sale->sale_number,
                        'grand_total' => $sale->grand_total,
                        'payment_method' => $request->payment_method,
                        'lines' => $request->lines,
                    ],
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }

            return redirect()->back()->with('success', 'Sale completed successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to process sale: ' . $e->getMessage());
        }
    }
}
