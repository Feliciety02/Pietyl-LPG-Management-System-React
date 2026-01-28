<?php

namespace Database\Seeders;

use App\Models\RestockRequest;
use App\Models\RestockRequestItem;
use App\Models\ProductVariant;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class RestockRequestItemSeeder extends Seeder
{
    public function run(): void
    {
        $requests = RestockRequest::all();
        
        if ($requests->isEmpty()) {
            $this->command->warn('No restock requests found. Run RestockRequestSeeder first.');
            return;
        }

        $variants = ProductVariant::all();
        $suppliers = Supplier::all();
        
        if ($variants->isEmpty()) {
            $this->command->warn('No product variants found.');
            return;
        }

        // Get specific variants
        $variant11kg = $variants->where('size_value', 11.0)->first();
        $variant22kg = $variants->where('size_value', 22.0)->first();
        $variant50kg = $variants->where('size_value', 50.0)->first();

        $primarySupplier = $suppliers->first();

        // Request 1 Items - Pending Urgent (11kg)
        if ($requests->count() >= 1 && $variant11kg) {
            RestockRequestItem::create([
                'restock_request_id' => $requests[0]->id,
                'product_variant_id' => $variant11kg->id,
                'current_qty' => 5,
                'reorder_level' => 20,
                'requested_qty' => 30,
                'supplier_id' => $primarySupplier?->id,
                'linked_purchase_id' => null,
            ]);
        }

        // Request 2 Items - Approved (22kg)
        if ($requests->count() >= 2 && $variant22kg) {
            RestockRequestItem::create([
                'restock_request_id' => $requests[1]->id,
                'product_variant_id' => $variant22kg->id,
                'current_qty' => 12,
                'reorder_level' => 15,
                'requested_qty' => 25,
                'supplier_id' => $primarySupplier?->id,
                'linked_purchase_id' => null, // Could link to a purchase if you have purchases seeded
            ]);
        }

        // Request 3 Items - Pending Normal (50kg + 11kg)
        if ($requests->count() >= 3 && $variant50kg && $variant11kg) {
            RestockRequestItem::create([
                'restock_request_id' => $requests[2]->id,
                'product_variant_id' => $variant50kg->id,
                'current_qty' => 3,
                'reorder_level' => 10,
                'requested_qty' => 15,
                'supplier_id' => $primarySupplier?->id,
                'linked_purchase_id' => null,
            ]);

            RestockRequestItem::create([
                'restock_request_id' => $requests[2]->id,
                'product_variant_id' => $variant11kg->id,
                'current_qty' => 8,
                'reorder_level' => 20,
                'requested_qty' => 20,
                'supplier_id' => $primarySupplier?->id,
                'linked_purchase_id' => null,
            ]);
        }

        // Request 4 Items - Rejected (22kg)
        if ($requests->count() >= 4 && $variant22kg) {
            RestockRequestItem::create([
                'restock_request_id' => $requests[3]->id,
                'product_variant_id' => $variant22kg->id,
                'current_qty' => 25,
                'reorder_level' => 15,
                'requested_qty' => 10,
                'supplier_id' => $primarySupplier?->id,
                'linked_purchase_id' => null,
            ]);
        }
    }
}