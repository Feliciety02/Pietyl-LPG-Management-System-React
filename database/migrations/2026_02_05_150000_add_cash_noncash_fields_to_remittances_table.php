<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('remittances', function (Blueprint $table) {
            $table->decimal('expected_cash', 12, 2)->default(0)->after('accountant_user_id');
            $table->decimal('expected_noncash_total', 12, 2)->default(0)->after('expected_amount');
            $table->json('expected_by_method')->nullable()->after('expected_noncash_total');
            $table->decimal('remitted_cash_amount', 12, 2)->nullable()->after('remitted_amount');
            $table->decimal('cash_variance', 12, 2)->nullable()->after('variance_amount');
            $table->timestamp('noncash_verified_at')->nullable()->after('cash_variance');
            $table->unsignedBigInteger('noncash_verified_by_user_id')->nullable()->after('noncash_verified_at');
            $table->json('noncash_verification')->nullable()->after('noncash_verified_by_user_id');

            $table->foreign('noncash_verified_by_user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('remittances', function (Blueprint $table) {
            $table->dropForeign(['noncash_verified_by_user_id']);
            $table->dropColumn([
                'expected_cash',
                'expected_noncash_total',
                'expected_by_method',
                'remitted_cash_amount',
                'cash_variance',
                'noncash_verified_at',
                'noncash_verified_by_user_id',
                'noncash_verification',
            ]);
        });
    }
};
