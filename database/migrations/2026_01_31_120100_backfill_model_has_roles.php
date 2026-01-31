<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('user_roles') || !Schema::hasTable('model_has_roles')) {
            return;
        }

        $rows = DB::table('user_roles')->select('user_id', 'role_id')->get();
        if ($rows->isEmpty()) {
            return;
        }

        $payload = $rows->map(function ($row) {
            return [
                'role_id' => $row->role_id,
                'model_type' => \App\Models\User::class,
                'model_id' => $row->user_id,
            ];
        })->all();

        DB::table('model_has_roles')->insertOrIgnore($payload);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('model_has_roles')) {
            return;
        }

        DB::table('model_has_roles')
            ->where('model_type', \App\Models\User::class)
            ->delete();
    }
};
