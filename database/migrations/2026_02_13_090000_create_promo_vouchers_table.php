<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('promo_vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name')->nullable();
            $table->enum('kind', ['promo', 'voucher'])->default('promo');
            $table->enum('discount_type', ['percent', 'amount'])->default('percent');
            $table->decimal('value', 12, 2)->default(0);
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('times_redeemed')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('discontinued_at')->nullable();
            $table->unsignedBigInteger('discontinued_by_user_id')->nullable();
            $table->timestamps();

            $table->foreign('discontinued_by_user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_vouchers');
    }
};
