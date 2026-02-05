<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->boolean('is_cashless')->default(false)->after('name')->index();
        });

        $cashlessKeys = ['gcash', 'card', 'bank', 'maya', 'online'];
        DB::table('payment_methods')->whereIn('method_key', $cashlessKeys)->update(['is_cashless' => true]);
        DB::table('payment_methods')->where('method_key', 'cash')->update(['is_cashless' => false]);
    }

    public function down(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropIndex(['is_cashless']);
            $table->dropColumn('is_cashless');
        });
    }
};
