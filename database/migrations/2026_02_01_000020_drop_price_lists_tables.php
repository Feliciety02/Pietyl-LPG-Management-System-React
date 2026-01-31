<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('sales', 'price_list_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropConstrainedForeignId('price_list_id');
            });
        }

        if (Schema::hasTable('price_list_items')) {
            Schema::drop('price_list_items');
        }

        if (Schema::hasTable('price_lists')) {
            Schema::drop('price_lists');
        }

        if (Schema::hasColumn('sale_items', 'pricing_source')) {
            DB::statement("ALTER TABLE sale_items MODIFY pricing_source VARCHAR(50) NOT NULL DEFAULT 'base_price'");
        }
    }

    public function down(): void
    {
        Schema::create('price_lists', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();

            $table->index('is_active');
        });

        Schema::create('price_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('price_list_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->decimal('price', 12, 2)->default(0);
            $table->string('currency', 20)->default('PHP');
            $table->timestamps();

            $table->unique(['price_list_id', 'product_variant_id'], 'uq_price_list_variant');
        });

        if (Schema::hasTable('sales') && !Schema::hasColumn('sales', 'price_list_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->foreignId('price_list_id')->nullable()->constrained()->onDelete('set null');
            });
        }

        if (Schema::hasColumn('sale_items', 'pricing_source')) {
            DB::statement("ALTER TABLE sale_items MODIFY pricing_source VARCHAR(50) NOT NULL DEFAULT 'price_list'");
        }
    }
};
