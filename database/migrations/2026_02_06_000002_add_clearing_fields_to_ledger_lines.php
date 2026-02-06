<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('ledger_lines', function (Blueprint $table) {
            $table->boolean('cleared')->default(false)->after('credit');
            $table->string('bank_ref', 100)->nullable()->after('cleared');
        });
    }

    public function down()
    {
        Schema::table('ledger_lines', function (Blueprint $table) {
            $table->dropColumn(['cleared', 'bank_ref']);
        });
    }
};
