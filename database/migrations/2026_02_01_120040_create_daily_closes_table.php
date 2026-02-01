<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_closes', function (Blueprint $table) {
            $table->id();
            $table->date('business_date')->unique();
            $table->unsignedBigInteger('finalized_by_user_id');
            $table->timestamp('finalized_at');
            $table->timestamps();

            $table->foreign('finalized_by_user_id')->references('id')->on('users')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_closes');
    }
};
