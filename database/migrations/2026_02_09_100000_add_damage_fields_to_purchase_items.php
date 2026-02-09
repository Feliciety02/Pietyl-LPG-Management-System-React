<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_items', 'damaged_qty')) {
                $table->decimal('damaged_qty', 12, 3)->default(0);
            }
            if (!Schema::hasColumn('purchase_items', 'damage_reason')) {
                $table->text('damage_reason')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            if (Schema::hasColumn('purchase_items', 'damage_reason')) {
                $table->dropColumn('damage_reason');
            }
            if (Schema::hasColumn('purchase_items', 'damaged_qty')) {
                $table->dropColumn('damaged_qty');
            }
        });
    }
};
