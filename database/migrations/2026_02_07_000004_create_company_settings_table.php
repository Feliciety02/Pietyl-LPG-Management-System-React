<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('vat_registered')->default(false);
            $table->decimal('vat_rate', 5, 4)->default(config('vat.default_rate', 0.12));
            $table->date('vat_effective_date')->nullable();
            $table->string('vat_mode', 32)->default(config('vat.default_mode', 'inclusive'));
            $table->timestamps();
        });

        if (Schema::hasTable('company_settings') && DB::table('company_settings')->count() === 0) {
            DB::table('company_settings')->insert([
                'vat_registered' => false,
                'vat_rate' => config('vat.default_rate', 0.12),
                'vat_mode' => config('vat.default_mode', 'inclusive'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};
