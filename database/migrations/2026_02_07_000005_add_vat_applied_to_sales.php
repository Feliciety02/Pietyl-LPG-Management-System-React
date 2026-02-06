<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'vat_applied')) {
                $table->boolean('vat_applied')->default(false)->after('vat_rate');
            }
        });

        if (Schema::hasTable('sales')) {
            DB::table('sales')->update(['vat_applied' => false]);
        }
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'vat_applied')) {
                $table->dropColumn('vat_applied');
            }
        });
    }
};
