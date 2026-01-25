<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('price_list_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained()->onDelete('cascade');
            $table->decimal('price', 12, 2)->default(0);
            $table->string('currency', 10)->default('PHP');
            $table->timestamps();
            
            $table->unique(['price_list_id', 'product_variant_id'], 'uq_price_list_variant');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_list_items');
    }
};