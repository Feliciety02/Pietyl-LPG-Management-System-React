<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'noncash_verified_at')) {
                $table->timestamp('noncash_verified_at')->nullable()->after('paid_at');
            }
            if (!Schema::hasColumn('payments', 'noncash_verified_by_user_id')) {
                $table->foreignId('noncash_verified_by_user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete()
                    ->after('noncash_verified_at');
            }
            if (!Schema::hasColumn('payments', 'noncash_verified_business_date')) {
                $table->date('noncash_verified_business_date')->nullable()->after('reference_no');
            }
            if (!Schema::hasColumn('payments', 'noncash_remittance_id')) {
                $table->foreignId('noncash_remittance_id')
                    ->nullable()
                    ->constrained('remittances')
                    ->nullOnDelete()
                    ->after('noncash_verified_by_user_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'noncash_remittance_id')) {
                $table->dropForeign(['noncash_remittance_id']);
                $table->dropColumn('noncash_remittance_id');
            }
            if (Schema::hasColumn('payments', 'noncash_verified_business_date')) {
                $table->dropColumn('noncash_verified_business_date');
            }
            if (Schema::hasColumn('payments', 'noncash_verified_by_user_id')) {
                $table->dropForeign(['noncash_verified_by_user_id']);
                $table->dropColumn('noncash_verified_by_user_id');
            }
            if (Schema::hasColumn('payments', 'noncash_verified_at')) {
                $table->dropColumn('noncash_verified_at');
            }
        });
    }
};
