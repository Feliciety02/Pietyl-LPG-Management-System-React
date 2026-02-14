<?php

namespace App\Services\POS;

use App\Models\Sale;
use App\Models\User;
use App\Repositories\PaymentRepository;
use App\Repositories\SaleRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Throwable;

class POSSaleService
{
    public function __construct(
        private SaleRepository $saleRepository,
        private PaymentRepository $paymentRepository,
        private SaleTotalsService $saleTotalsService,
        private DiscountService $discountService,
        private PaymentProcessingService $paymentProcessingService,
        private StockManagementService $stockManagementService,
        private AccountingService $accountingService,
        private DeliveryManagementService $deliveryManagementService
    ) {}

    public function processSale(array $data, User $user): array
    {
        // Check if sales are locked
        if ($this->saleRepository->isSaleLocked(now()->toDateString())) {
            throw ValidationException::withMessages([
                'locked' => 'Sales are locked for this business date.',
            ]);
        }

        // Validate payment reference
        $this->paymentProcessingService->validatePaymentReference(
            $data['payment_method'],
            $data['payment_ref'] ?? null
        );

        DB::beginTransaction();

        $sale = null;

        try {
            Log::info('POSSaleService: processing sale', [
                'user_id' => $user->id,
                'customer_id' => $data['customer_id'],
                'is_delivery' => $data['is_delivery'] ?? false,
                'payment_method' => $data['payment_method'],
                'lines_count' => count($data['lines']),
            ]);

            // Calculate totals
            $saleDate = Carbon::now();
            $discountSummary = $this->discountService->validateDiscounts($data, $user, $data['lines'], $saleDate);
            $data['discount_total'] = $discountSummary['total'];

            $totals = $this->saleTotalsService->calculateTotals($data['lines'], $data, $saleDate);

            Log::info('POSSaleService: totals calculated', $totals);

            // Process cash payment
            $cashDetails = $this->paymentProcessingService->validateAndCalculateCash(
                $data['payment_method'],
                $data['cash_tendered'] ?? null,
                $totals['grand_total']
            );

            // Create sale
            $sale = $this->createSale($data, $totals, $cashDetails, $user, $saleDate);

            Log::info('POSSaleService: sale created', [
                'sale_id' => $sale->id,
                'sale_number' => $sale->sale_number,
            ]);

            // Create sale items and process stock
            $this->processSaleItems($sale, $data['lines'], $totals, $user);

            // Record promo/voucher redemptions and manual discount audit
            $this->discountService->recordDiscounts($sale, $discountSummary['items'], $user, $saleDate);

            // Create payment record
            $this->createPayment($sale, $data, $totals['gross_amount'], $user);

            // Post accounting entries
            $this->accountingService->postSaleEntries(
                $sale, 
                $data['lines'], 
                $totals, 
                $data['payment_method'], 
                $user
            );

            // Create receipt
            $this->saleRepository->createReceipt($sale->id);

            // Create delivery if needed
            if ($data['is_delivery'] ?? false) {
                $this->deliveryManagementService->createDeliveryForSale($sale, $data['customer_id']);
            }

            DB::commit();

            Log::info('POSSaleService: sale completed successfully', [
                'sale_id' => $sale->id,
                'sale_number' => $sale->sale_number,
            ]);

            return [
                'success' => true,
                'sale' => $sale,
                'message' => 'Sale completed successfully!',
            ];

        } catch (Throwable $e) {
            DB::rollBack();

            Log::error('POSSaleService: FAILED and rolled back', [
                'sale_id' => $sale?->id,
                'sale_number' => $sale?->sale_number,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => substr($e->getTraceAsString(), 0, 2000),
            ]);

            throw $e;
        }
    }

    private function createSale(array $data, array $totals, array $cashDetails, User $user, Carbon $saleDate): Sale
    {
        $salePayload = [
            'sale_number' => $this->saleRepository->generateSaleNumber(),
            'sale_type' => ($data['is_delivery'] ?? false) ? 'delivery' : 'walkin',
            'customer_id' => $data['customer_id'],
            'cashier_user_id' => $user->id,
            'status' => 'paid',
            'sale_datetime' => $saleDate,
            'subtotal' => $totals['subtotal'],
            'discount_total' => $totals['discount'],
            'tax_total' => $totals['tax'],
            'grand_total' => $totals['grand_total'],
            'vat_treatment' => $totals['vat_result']['treatment'],
            'vat_rate' => $totals['vat_result']['rate_used'],
            'vat_inclusive' => $totals['vat_result']['inclusive'],
            'vat_amount' => $totals['vat_amount'],
            'net_amount' => $totals['net_amount'],
            'gross_amount' => $totals['gross_amount'],
            'vat_applied' => $totals['vat_applied'],
        ];

        if (Schema::hasColumn('sales', 'cash_tendered')) {
            $salePayload['cash_tendered'] = $cashDetails['cash_tendered'];
        }
        if (Schema::hasColumn('sales', 'cash_change')) {
            $salePayload['cash_change'] = $cashDetails['cash_change'];
        }

        return $this->saleRepository->create($salePayload);
    }

    private function processSaleItems(Sale $sale, array $lines, array $totals, User $user): void
    {
        foreach ($lines as $i => $line) {
            Log::info('POSSaleService: processing line', [
                'sale_id' => $sale->id,
                'line_index' => $i,
                'product_id' => $line['product_id'],
                'qty' => $line['qty'],
            ]);

            $qty = (float) $line['qty'];
            $unitPrice = (float) $line['unit_price'];
            $lineAmount = $qty * $unitPrice;

            $lineVat = $this->saleTotalsService->calculateLineVat(
                $lineAmount,
                $totals['vat_rate'],
                $totals['vat_inclusive'],
                $totals['vat_treatment']
            );

            // Create sale item
            $this->saleRepository->createSaleItem([
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

            // Process stock movement
            $this->stockManagementService->processStockMovement($sale, $line, $user);
        }
    }

    private function createPayment(Sale $sale, array $data, float $grossAmount, User $user): void
    {
        $paymentMethod = $this->paymentRepository->findPaymentMethodByKey($data['payment_method']);

        if (!$paymentMethod) {
            Log::warning('POSSaleService: payment method not found', [
                'sale_id' => $sale->id,
                'method_key' => $data['payment_method'],
            ]);
            return;
        }

        $needsRef = in_array($data['payment_method'], ['gcash', 'card'], true);

        $this->paymentRepository->createPayment([
            'sale_id' => $sale->id,
            'payment_method_id' => $paymentMethod->id,
            'amount' => $grossAmount,
            'reference_no' => $needsRef ? trim($data['payment_ref'] ?? '') : null,
            'received_by_user_id' => $user->id,
            'paid_at' => Carbon::now(),
        ]);
    }
}
