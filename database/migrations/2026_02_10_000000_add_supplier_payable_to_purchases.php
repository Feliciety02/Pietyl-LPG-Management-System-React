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
        Schema::table('purchases', function (Blueprint $table) {
            if (!Schema::hasColumn('purchases', 'supplier_payable_id')) {
                $table->unsignedBigInteger('supplier_payable_id')->nullable()->after('supplier_id');
                $table->foreign('supplier_payable_id')
                    ->references('id')
                    ->on('supplier_payables')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            if (Schema::hasColumn('purchases', 'supplier_payable_id')) {
                $table->dropForeign(['supplier_payable_id']);
                $table->dropColumn('supplier_payable_id');
            }
        });
    }
};
