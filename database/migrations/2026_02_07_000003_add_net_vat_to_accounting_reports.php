<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounting_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('accounting_reports', 'total_net_sales')) {
                $table->decimal('total_net_sales', 12, 2)->nullable()->after('total_sales');
            }

            if (!Schema::hasColumn('accounting_reports', 'total_vat')) {
                $table->decimal('total_vat', 12, 2)->nullable()->after('total_net_sales');
            }
        });
    }

    public function down(): void
    {
        Schema::table('accounting_reports', function (Blueprint $table) {
            if (Schema::hasColumn('accounting_reports', 'total_vat')) {
                $table->dropColumn('total_vat');
            }
            if (Schema::hasColumn('accounting_reports', 'total_net_sales')) {
                $table->dropColumn('total_net_sales');
            }
        });
    }
};
