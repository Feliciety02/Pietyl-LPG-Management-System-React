<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('promo_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('promo_voucher_id')->constrained('promo_vouchers')->cascadeOnDelete();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('cashier_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->timestamp('redeemed_at')->nullable();
            $table->timestamps();

            $table->unique(['promo_voucher_id', 'sale_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_redemptions');
    }
};
