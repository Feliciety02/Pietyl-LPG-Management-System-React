<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'vat_treatment')) {
                $table->string('vat_treatment', 32)
                    ->default('vatable_12')
                    ->after('sale_datetime');
            }

            if (!Schema::hasColumn('sales', 'vat_rate')) {
                $table->decimal('vat_rate', 5, 4)
                    ->default(0.1200)
                    ->after('vat_treatment');
            }

            if (!Schema::hasColumn('sales', 'vat_inclusive')) {
                $table->boolean('vat_inclusive')
                    ->default(true)
                    ->after('vat_rate');
            }

            if (!Schema::hasColumn('sales', 'vat_amount')) {
                $table->decimal('vat_amount', 12, 2)
                    ->default(0)
                    ->after('grand_total');
            }

            if (!Schema::hasColumn('sales', 'net_amount')) {
                $table->decimal('net_amount', 12, 2)
                    ->default(0)
                    ->after('vat_amount');
            }

            if (!Schema::hasColumn('sales', 'gross_amount')) {
                $table->decimal('gross_amount', 12, 2)
                    ->default(0)
                    ->after('net_amount');
            }
        });

        if (Schema::hasTable('sales')) {
            $defaultRate = config('vat.default_rate', 0.12);
            $defaultInclusive = config('vat.default_inclusive', true);

            DB::table('sales')->update([
                'vat_treatment' => 'exempt',
                'vat_rate' => $defaultRate,
                'vat_inclusive' => $defaultInclusive,
                'vat_amount' => 0,
                'net_amount' => DB::raw('grand_total'),
                'gross_amount' => DB::raw('grand_total'),
            ]);

            Log::info('VAT fields added to sales table and existing rows marked as exempt.');
        }
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'gross_amount')) {
                $table->dropColumn('gross_amount');
            }
            if (Schema::hasColumn('sales', 'net_amount')) {
                $table->dropColumn('net_amount');
            }
            if (Schema::hasColumn('sales', 'vat_amount')) {
                $table->dropColumn('vat_amount');
            }
            if (Schema::hasColumn('sales', 'vat_inclusive')) {
                $table->dropColumn('vat_inclusive');
            }
            if (Schema::hasColumn('sales', 'vat_rate')) {
                $table->dropColumn('vat_rate');
            }
            if (Schema::hasColumn('sales', 'vat_treatment')) {
                $table->dropColumn('vat_treatment');
            }
        });
    }
};
