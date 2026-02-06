<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sale_items', 'line_net_amount')) {
                $table->decimal('line_net_amount', 12, 2)
                    ->nullable()
                    ->after('line_total');
            }

            if (!Schema::hasColumn('sale_items', 'line_vat_amount')) {
                $table->decimal('line_vat_amount', 12, 2)
                    ->nullable()
                    ->after('line_net_amount');
            }

            if (!Schema::hasColumn('sale_items', 'line_gross_amount')) {
                $table->decimal('line_gross_amount', 12, 2)
                    ->nullable()
                    ->after('line_vat_amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            if (Schema::hasColumn('sale_items', 'line_gross_amount')) {
                $table->dropColumn('line_gross_amount');
            }
            if (Schema::hasColumn('sale_items', 'line_vat_amount')) {
                $table->dropColumn('line_vat_amount');
            }
            if (Schema::hasColumn('sale_items', 'line_net_amount')) {
                $table->dropColumn('line_net_amount');
            }
        });
    }
};
