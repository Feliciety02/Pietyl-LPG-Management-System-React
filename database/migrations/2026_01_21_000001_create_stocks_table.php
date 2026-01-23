<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();

            // Link to product
            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('supplier_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->integer('filled_qty')->default(0);
            $table->integer('empty_qty')->default(0);
            $table->integer('restock_at')->default(10);
            $table->timestamp('last_counted_at')->nullable();
            $table->string('updated_by')->nullable();
            $table->string('reason')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
