<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_payables', function (Blueprint $table) {
            if (!Schema::hasColumn('supplier_payables', 'purchase_id')) {
                $table->unsignedBigInteger('purchase_id')->nullable()->after('source_id');
                $table->foreign('purchase_id')->references('id')->on('purchases')->onDelete('cascade');
            }

            if (!Schema::hasColumn('supplier_payables', 'gross_amount')) {
                $table->decimal('gross_amount', 15, 2)->default(0)->after('amount');
            }
            if (!Schema::hasColumn('supplier_payables', 'deductions_total')) {
                $table->decimal('deductions_total', 15, 2)->default(0)->after('gross_amount');
            }
            if (!Schema::hasColumn('supplier_payables', 'net_amount')) {
                $table->decimal('net_amount', 15, 2)->default(0)->after('deductions_total');
            }
            if (!Schema::hasColumn('supplier_payables', 'paid_amount')) {
                $table->decimal('paid_amount', 15, 2)->default(0)->after('net_amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('supplier_payables', function (Blueprint $table) {
            foreach (['paid_amount', 'net_amount', 'deductions_total', 'gross_amount'] as $column) {
                if (Schema::hasColumn('supplier_payables', $column)) {
                    $table->dropColumn($column);
                }
            }

            if (Schema::hasColumn('supplier_payables', 'purchase_id')) {
                $table->dropForeign(['purchase_id']);
                $table->dropColumn('purchase_id');
            }
        });
    }
};
