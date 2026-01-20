<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->string('sku')->unique()->index(); // product SKU
            $table->string('name');                   // product name
            $table->string('variant')->nullable();    // e.g., 11kg, 22kg, etc.

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
