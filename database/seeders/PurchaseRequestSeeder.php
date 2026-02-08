<?php

namespace Database\Seeders;

use App\Models\InventoryMovement;
use App\Models\Location;
use App\Models\Product;
use App\Models\PurchaseReceipt;
use App\Models\PurchaseReceiptItem;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PurchaseRequestSeeder extends Seeder
{
    public function run(): void
    {
        $inventoryUser = User::where('email', 'inventory@pietyl.test')->first();
        $adminUser = User::where('email', 'admin@pietyl.test')->first();
        $supplier = Supplier::first();
        $products = Product::take(3)->get();
        $location = Location::first();

        if (!$inventoryUser || !$adminUser || !$supplier || $products->isEmpty() || !$location) {
            return;
        }

        DB::transaction(function () use ($inventoryUser, $adminUser, $supplier, $products, $location) {
            $firstPr = PurchaseRequest::updateOrCreate(
                ['pr_number' => 'PR-LOW-001'],
                [
                    'requested_by_user_id' => $inventoryUser->id,
                    'status' => PurchaseRequest::STATUS_SUBMITTED,
                    'reason' => 'System triggered low stock suggestion for essential LPG cylinders.',
                    'notes' => 'Needs admin approval before supplier outreach.',
                    'requested_at' => now()->subDays(4),
                ]
            );

            $this->attachItems($firstPr, $products->slice(0, 2), 18, 0, 0, 0);
            $firstPr->update(['total_estimated_cost' => $this->calculateEstimated($firstPr)]);

            $secondPr = PurchaseRequest::updateOrCreate(
                ['pr_number' => 'PR-SUP-002'],
                [
                    'requested_by_user_id' => $inventoryUser->id,
                    'status' => PurchaseRequest::STATUS_SUPPLIER_CONTACTED_WAITING_DELIVERY,
                    'reason' => 'Manual reorder for refill tanks ahead of weekend rush.',
                    'notes' => 'Admin already approved quantities and contacted supplier.',
                    'admin_user_id' => $adminUser->id,
                    'admin_action_at' => now()->subDays(1),
                    'supplier_id' => $supplier->id,
                    'expected_delivery_date' => now()->addDays(2)->toDateString(),
                    'supplier_contacted_at' => now()->subDays(1),
                ]
            );

            $this->attachItems($secondPr, $products, 32, 30, 170.25, 165.75);
            $secondPr->update(['total_estimated_cost' => $this->calculateEstimated($secondPr)]);

            $receipt = PurchaseReceipt::updateOrCreate(
                ['purchase_request_id' => $secondPr->id],
                [
                    'received_by_user_id' => $inventoryUser->id,
                    'received_at' => now()->subHours(3),
                    'delivery_receipt_no' => 'DR-' . now()->format('YmdHis'),
                    'notes' => 'Partial delivery arrived this morning.',
                ]
            );

            foreach ($secondPr->items as $item) {
                $received = max(0, min($item->approved_qty ?? 0, (int) floor(($item->requested_qty ?? 0) * 0.75)));
                $damaged = intval(min(2, ceil($received * 0.1)));
                PurchaseReceiptItem::updateOrCreate(
                    [
                        'purchase_receipt_id' => $receipt->id,
                        'purchase_request_item_id' => $item->id,
                    ],
                    [
                        'received_qty' => $received,
                        'damaged_qty' => $damaged,
                    ]
                );

                $item->fill([
                    'received_qty' => $received,
                    'damaged_qty' => $damaged,
                    'unit_cost_final' => 165.75,
                ])->save();

                InventoryMovement::create([
                    'source_type' => PurchaseReceipt::class,
                    'source_id' => $receipt->id,
                    'location_id' => $location->id,
                    'product_id' => $item->product_id,
                    'qty_in' => max(0, $received - $damaged),
                    'qty_out' => 0,
                    'remarks' => 'Stock-in from partial receipt ' . $receipt->delivery_receipt_no,
                    'created_by_user_id' => $inventoryUser->id,
                ]);
            }

            $secondPr->update(['status' => PurchaseRequest::STATUS_PARTIALLY_RECEIVED]);
        });
    }

    private function attachItems(PurchaseRequest $request, $products, int $requestedQty, int $approvedQty, float $unitCost = 150.00, float $finalCost = 0.0): void
    {
        foreach ($products as $product) {
            PurchaseRequestItem::updateOrCreate(
                [
                    'purchase_request_id' => $request->id,
                    'product_id' => $product->id,
                ],
                [
                    'requested_qty' => $requestedQty,
                    'approved_qty' => $approvedQty > 0 ? $approvedQty : null,
                    'unit_cost_estimated' => $unitCost,
                    'unit_cost_final' => $finalCost > 0 ? $finalCost : null,
                ]
            );
        }
    }

    private function calculateEstimated(PurchaseRequest $request): float
    {
        return (float) $request->items->sum(function (PurchaseRequestItem $item) {
            return ($item->approved_qty ?? $item->requested_qty ?? 0) * ($item->unit_cost_estimated ?? 0);
        });
    }
}
