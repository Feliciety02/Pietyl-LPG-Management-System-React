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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id');
            $table->unsignedBigInteger('product_variant_id');
            $table->string('movement_type', 50);
            $table->decimal('qty', 12, 3);
            $table->string('reference_type', 50)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->unsignedBigInteger('performed_by_user_id');
            $table->dateTime('moved_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('location_id', 'fk_stock_movements_location')
                  ->references('id')->on('locations')
                  ->onDelete('restrict');
            
            $table->foreign('product_variant_id', 'fk_stock_movements_variant')
                  ->references('id')->on('product_variants')
                  ->onDelete('restrict');
            
            $table->foreign('performed_by_user_id', 'fk_stock_movements_user')
                  ->references('id')->on('users')
                  ->onDelete('restrict');

            // Indexes
            $table->index(['location_id', 'moved_at'], 'idx_stock_movements_loc_time');
            $table->index(['product_variant_id', 'moved_at'], 'idx_stock_movements_variant_time');
            $table->index(['reference_type', 'reference_id'], 'idx_stock_movements_ref');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};