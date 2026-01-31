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
        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_id');
            $table->unsignedBigInteger('product_variant_id');
            $table->decimal('received_qty', 12, 3)->default(0);
            $table->decimal('qty', 12, 3)->default(0);
            $table->decimal('unit_cost', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->timestamps();

            // Foreign keys
            $table->foreign('purchase_id', 'fk_purchase_items_purchase')
                  ->references('id')->on('purchases')
                  ->onDelete('cascade');
            
            $table->foreign('product_variant_id', 'fk_purchase_items_variant')
                  ->references('id')->on('product_variants')
                  ->onDelete('restrict');

            // Indexes
            $table->index('purchase_id', 'idx_purchase_items_purchase');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
    }
};