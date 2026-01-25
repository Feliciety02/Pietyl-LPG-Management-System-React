<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('sale_number', 50)->unique();
            $table->string('sale_type', 50)->default('walkin');
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('cashier_user_id')->constrained('users')->onDelete('restrict');
            $table->string('status', 50)->default('paid');
            $table->dateTime('sale_datetime');
            $table->foreignId('price_list_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('tax_total', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('sale_datetime');
            $table->index('status');
            $table->index('sale_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};