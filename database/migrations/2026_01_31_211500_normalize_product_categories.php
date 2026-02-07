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

        $productCategories = DB::table('products')
            ->whereIn('category', ['lpg', 'stove', 'accessories'])
            ->pluck('category', 'id');

        foreach ($productCategories as $productId => $category) {
            DB::table('product_variants')
                ->where('product_id', $productId)
                ->update([
                    'container_type' => $category,
                    'barcode' => null,
                ]);
        }
    }

    public function down(): void
    {
        DB::table('products')
            ->where('category', 'accessories')
            ->update(['category' => 'accessory']);
    }
};
