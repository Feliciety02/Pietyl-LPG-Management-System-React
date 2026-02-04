<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restock_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restock_request_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained()->onDelete('cascade');
            $table->decimal('current_qty', 12, 3)->default(0);
            $table->decimal('reorder_level', 12, 3)->default(0);
            $table->decimal('requested_qty', 12, 3)->default(0);
            $table->foreignId('supplier_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('linked_purchase_id')->nullable()->constrained('purchases')->onDelete('set null');
            $table->timestamps();
            
            $table->index('restock_request_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restock_request_items');
    }
};