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
        Schema::create('supplier_payables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->onDelete('restrict');
            $table->string('source_type', 100);
            $table->unsignedBigInteger('source_id');
            $table->decimal('amount', 15, 2);
            $table->string('status', 20)->default('unpaid');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('paid_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('payment_method')->nullable();
            $table->string('bank_ref')->nullable();
            $table->foreignId('ledger_entry_id')->nullable()->constrained('ledger_entries')->onDelete('set null');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['source_type', 'source_id']);
            $table->index(['supplier_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_payables');
    }
};
