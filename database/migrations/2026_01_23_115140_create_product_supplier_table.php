<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_supplier', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained()->onDelete('cascade');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            // Prevent duplicate product-supplier combinations
            $table->unique(['product_id', 'supplier_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_supplier');
    }
};