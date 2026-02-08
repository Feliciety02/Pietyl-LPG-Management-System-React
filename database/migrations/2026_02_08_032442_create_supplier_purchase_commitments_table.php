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
        Schema::create('supplier_purchase_commitments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_request_id');
            $table->string('expense_type', 80)->default('supplier_purchase_commitment');
            $table->string('reference')->nullable();
            $table->decimal('amount_estimated', 12, 2)->nullable();
            $table->decimal('amount_final', 12, 2)->nullable();
            $table->string('currency', 8)->default('PHP');
            $table->string('status', 30)->default('pending');
            $table->unsignedBigInteger('created_by_user_id');
            $table->unsignedBigInteger('posted_by_user_id')->nullable();
            $table->dateTime('posted_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('purchase_request_id')->references('id')->on('purchase_requests')->cascadeOnDelete();
            $table->foreign('created_by_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('posted_by_user_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['purchase_request_id']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_purchase_commitments');
    }
};
