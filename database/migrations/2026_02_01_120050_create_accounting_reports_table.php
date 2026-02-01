<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_type', 50);
            $table->date('date_from');
            $table->date('date_to');
            $table->decimal('total_sales', 12, 2)->nullable();
            $table->decimal('total_cash', 12, 2)->nullable();
            $table->decimal('total_non_cash', 12, 2)->nullable();
            $table->decimal('total_remitted', 12, 2)->nullable();
            $table->decimal('variance_total', 12, 2)->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->unsignedBigInteger('generated_by_user_id')->nullable();
            $table->timestamps();

            $table->index('report_type');
            $table->index(['date_from', 'date_to']);
            $table->foreign('generated_by_user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_reports');
    }
};
