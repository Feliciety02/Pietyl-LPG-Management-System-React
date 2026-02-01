<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('remittances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cashier_user_id');
            $table->unsignedBigInteger('accountant_user_id')->nullable();
            $table->date('business_date');
            $table->decimal('expected_amount', 12, 2)->default(0);
            $table->decimal('remitted_amount', 12, 2)->nullable();
            $table->decimal('variance_amount', 12, 2)->nullable();
            $table->string('status', 50)->default('pending');
            $table->text('note')->nullable();
            $table->timestamp('recorded_at')->nullable();
            $table->timestamps();

            $table->foreign('cashier_user_id')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('accountant_user_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['business_date', 'cashier_user_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('remittances');
    }
};
