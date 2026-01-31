<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('products')
            ->where('category', 'accessory')
            ->update(['category' => 'accessories']);

        DB::statement("
            UPDATE product_variants pv
            INNER JOIN products p ON p.id = pv.product_id
            SET pv.container_type = p.category,
                pv.barcode = NULL
            WHERE p.category IN ('lpg', 'stove', 'accessories')
        ");
    }

    public function down(): void
    {
        DB::table('products')
            ->where('category', 'accessories')
            ->update(['category' => 'accessory']);
    }
};
