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
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sale_id')->unique();
            $table->string('receipt_number', 50)->unique();
            $table->integer('printed_count')->default(0);
            $table->dateTime('issued_at');
            $table->timestamps();

            // Foreign key
            $table->foreign('sale_id', 'fk_receipts_sale')
                  ->references('id')->on('sales')
                  ->onDelete('cascade');

            // Index
            $table->index('issued_at', 'idx_receipts_issued_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};