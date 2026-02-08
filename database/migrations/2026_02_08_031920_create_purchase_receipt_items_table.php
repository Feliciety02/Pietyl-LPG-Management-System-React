<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('purchase_receipt_items')) {
            return;
        }

        Schema::create('purchase_receipt_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_receipt_id');
            $table->unsignedBigInteger('purchase_request_item_id');
            $table->integer('received_qty');
            $table->integer('damaged_qty')->default(0);
            $table->timestamps();

            $table->foreign('purchase_receipt_id')
                ->references('id')
                ->on('purchase_receipts')
                ->cascadeOnDelete();
            $table->foreign('purchase_request_item_id')
                ->references('id')
                ->on('purchase_request_items')
                ->cascadeOnDelete();
            $table->index(['purchase_receipt_id'], 'pri_idx_receipt');
            $table->index(['purchase_request_item_id'], 'pri_idx_request_item');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_receipt_items');
    }
};
