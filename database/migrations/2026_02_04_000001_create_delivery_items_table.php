<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_items', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('delivery_id');
            $table->unsignedBigInteger('product_variant_id');

            $table->string('product_name'); // snapshot at time of sale
            $table->string('variant')->nullable();

            $table->integer('qty')->default(0);

            $table->timestamps();

            $table->foreign('delivery_id')
                ->references('id')
                ->on('deliveries')
                ->onDelete('cascade');

            $table->foreign('product_variant_id')
                ->references('id')
                ->on('product_variants')
                ->onDelete('restrict');

            $table->index(['delivery_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_items');
    }
};
