<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_counts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inventory_balance_id');
            $table->unsignedBigInteger('product_variant_id');
            $table->unsignedBigInteger('location_id');

            $table->integer('system_filled')->default(0);
            $table->integer('system_empty')->default(0);
            $table->integer('counted_filled')->default(0);
            $table->integer('counted_empty')->default(0);
            $table->integer('variance_filled')->default(0);
            $table->integer('variance_empty')->default(0);

            $table->string('status', 20)->default('submitted'); // submitted, approved, rejected
            $table->text('note')->nullable();

            $table->unsignedBigInteger('created_by_user_id');
            $table->timestamp('submitted_at')->nullable();
            $table->unsignedBigInteger('reviewed_by_user_id')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();

            $table->timestamps();

            $table->foreign('inventory_balance_id')->references('id')->on('inventory_balances')->onDelete('cascade');
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->onDelete('restrict');
            $table->foreign('location_id')->references('id')->on('locations')->onDelete('restrict');
            $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('reviewed_by_user_id')->references('id')->on('users')->onDelete('set null');

            $table->index(['status', 'submitted_at']);
            $table->index(['inventory_balance_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_counts');
    }
};
