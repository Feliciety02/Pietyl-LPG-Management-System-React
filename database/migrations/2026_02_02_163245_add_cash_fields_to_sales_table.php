<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'cash_tendered')) {
                $table->decimal('cash_tendered', 12, 2)
                    ->nullable()
                    ->after('grand_total');
            }

            if (!Schema::hasColumn('sales', 'cash_change')) {
                $table->decimal('cash_change', 12, 2)
                    ->nullable()
                    ->after('cash_tendered');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'cash_change')) {
                $table->dropColumn('cash_change');
            }

            if (Schema::hasColumn('sales', 'cash_tendered')) {
                $table->dropColumn('cash_tendered');
            }
        });
    }
};
