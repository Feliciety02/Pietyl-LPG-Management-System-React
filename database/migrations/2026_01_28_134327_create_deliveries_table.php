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
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->string('delivery_number', 50)->unique();
            $table->unsignedBigInteger('sale_id')->nullable();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('address_id');
            $table->unsignedBigInteger('assigned_rider_user_id')->nullable();
            $table->string('status', 50)->default('pending');
            $table->dateTime('scheduled_at')->nullable();
            $table->dateTime('dispatched_at')->nullable();
            $table->dateTime('delivered_at')->nullable();
            $table->string('proof_type', 50)->nullable();
            $table->text('proof_url')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('sale_id', 'fk_deliveries_sale')
                  ->references('id')->on('sales')
                  ->onDelete('set null');
            
            $table->foreign('customer_id', 'fk_deliveries_customer')
                  ->references('id')->on('customers')
                  ->onDelete('restrict');
            
            $table->foreign('address_id', 'fk_deliveries_address')
                  ->references('id')->on('customer_addresses')
                  ->onDelete('restrict');
            
            $table->foreign('assigned_rider_user_id', 'fk_deliveries_rider')
                  ->references('id')->on('users')
                  ->onDelete('set null');

            // Indexes
            $table->index('status', 'idx_deliveries_status');
            $table->index('scheduled_at', 'idx_deliveries_scheduled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};