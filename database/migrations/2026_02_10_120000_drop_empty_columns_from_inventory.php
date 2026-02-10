<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('inventory_balances') && Schema::hasColumn('inventory_balances', 'qty_empty')) {
            Schema::table('inventory_balances', function (Blueprint $table) {
                $table->dropColumn('qty_empty');
            });
        }

        if (Schema::hasTable('stock_counts')) {
            $columns = [];

            if (Schema::hasColumn('stock_counts', 'system_empty')) {
                $columns[] = 'system_empty';
            }
            if (Schema::hasColumn('stock_counts', 'counted_empty')) {
                $columns[] = 'counted_empty';
            }
            if (Schema::hasColumn('stock_counts', 'variance_empty')) {
                $columns[] = 'variance_empty';
            }

            if ($columns) {
                Schema::table('stock_counts', function (Blueprint $table) use ($columns) {
                    $table->dropColumn($columns);
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('inventory_balances') && !Schema::hasColumn('inventory_balances', 'qty_empty')) {
            Schema::table('inventory_balances', function (Blueprint $table) {
                $table->integer('qty_empty')->default(0)->after('qty_filled');
            });
        }

        if (Schema::hasTable('stock_counts')) {
            Schema::table('stock_counts', function (Blueprint $table) {
                if (!Schema::hasColumn('stock_counts', 'system_empty')) {
                    $table->integer('system_empty')->default(0)->after('system_filled');
                }
                if (!Schema::hasColumn('stock_counts', 'counted_empty')) {
                    $table->integer('counted_empty')->default(0)->after('counted_filled');
                }
                if (!Schema::hasColumn('stock_counts', 'variance_empty')) {
                    $table->integer('variance_empty')->default(0)->after('variance_filled');
                }
            });
        }
    }
};
