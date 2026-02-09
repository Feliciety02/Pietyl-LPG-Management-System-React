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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('purchase_number', 50)->unique();
            $table->unsignedBigInteger('supplier_id');
            $table->unsignedBigInteger('created_by_user_id');
            $table->enum('status', \App\Enums\PurchaseStatus::values())->default(\App\Enums\PurchaseStatus::DRAFT);
            $table->dateTime('ordered_at')->nullable();
            $table->dateTime('received_at')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->timestamps();
            $table->foreign('supplier_id', 'fk_purchases_supplier')
                  ->references('id')->on('suppliers')
                  ->onDelete('restrict');
            $table->foreign('created_by_user_id', 'fk_purchases_created_by')
                  ->references('id')->on('users')
                  ->onDelete('restrict');
            $table->index('status', 'idx_purchases_status');
            $table->index('supplier_id', 'idx_purchases_supplier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
