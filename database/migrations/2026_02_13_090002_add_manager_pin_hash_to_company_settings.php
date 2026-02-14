<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('company_settings')) {
            return;
        }

        Schema::table('company_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('company_settings', 'manager_pin_hash')) {
                $table->string('manager_pin_hash')->nullable()->after('vat_mode');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('company_settings')) {
            return;
        }

        Schema::table('company_settings', function (Blueprint $table) {
            if (Schema::hasColumn('company_settings', 'manager_pin_hash')) {
                $table->dropColumn('manager_pin_hash');
            }
        });
    }
};
