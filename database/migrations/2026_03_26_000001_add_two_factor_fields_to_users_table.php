<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'two_factor_secret')) {
                $table->text('two_factor_secret')->nullable()->after('password');
            }

            if (!Schema::hasColumn('users', 'two_factor_confirmed_at')) {
                $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_secret');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('users', 'two_factor_confirmed_at')) {
                $columns[] = 'two_factor_confirmed_at';
            }

            if (Schema::hasColumn('users', 'two_factor_secret')) {
                $columns[] = 'two_factor_secret';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
