<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('products', 'supplier_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->foreignId('supplier_id')
                    ->nullable()
                    ->constrained('suppliers')
                    ->onDelete('cascade')
                    ->after('category');
            });
        }

        if (!Schema::hasColumn('products', 'supplier_cost')) {
            Schema::table('products', function (Blueprint $table) {
                $table->decimal('supplier_cost', 10, 2)->default(0)->after('supplier_id');
            });
        }

        if (!Schema::hasColumn('products', 'price')) {
            Schema::table('products', function (Blueprint $table) {
                $table->decimal('price', 10, 2)->default(0)->after('supplier_cost');
            });
        }

        $hasNameIndex = !empty(DB::select("SHOW INDEX FROM products WHERE Key_name = 'products_name_unique'"));
        $hasDuplicateNames = DB::table('products')
            ->select('name')
            ->groupBy('name')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if (!$hasNameIndex && !$hasDuplicateNames) {
            Schema::table('products', function (Blueprint $table) {
                $table->unique('name');
            });
        }
    }

    public function down(): void
    {
        $hasNameIndex = !empty(DB::select("SHOW INDEX FROM products WHERE Key_name = 'products_name_unique'"));
        if ($hasNameIndex) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropUnique('products_name_unique');
            });
        }

        if (Schema::hasColumn('products', 'price')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('price');
            });
        }

        if (Schema::hasColumn('products', 'supplier_cost')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('supplier_cost');
            });
        }

        if (Schema::hasColumn('products', 'supplier_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropConstrainedForeignId('supplier_id');
            });
        }
    }
};
