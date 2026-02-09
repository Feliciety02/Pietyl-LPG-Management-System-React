<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            if (!Schema::hasColumn('purchases', 'delivered_qty')) {
                $table->decimal('delivered_qty', 12, 3)->default(0)->after('received_at');
            }
            if (!Schema::hasColumn('purchases', 'damaged_qty')) {
                $table->decimal('damaged_qty', 12, 3)->default(0)->after('delivered_qty');
            }
            if (!Schema::hasColumn('purchases', 'missing_qty')) {
                $table->decimal('missing_qty', 12, 3)->default(0)->after('damaged_qty');
            }
            if (!Schema::hasColumn('purchases', 'damage_category')) {
                $table->string('damage_category', 100)->nullable()->after('missing_qty');
            }
            if (!Schema::hasColumn('purchases', 'damage_reason')) {
                $table->text('damage_reason')->nullable()->after('damage_category');
            }
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            foreach (['damage_reason', 'damage_category', 'missing_qty', 'damaged_qty', 'delivered_qty'] as $column) {
                if (Schema::hasColumn('purchases', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
