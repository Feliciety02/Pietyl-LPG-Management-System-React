<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restock_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number', 50)->unique();
            $table->foreignId('location_id')->constrained()->onDelete('restrict');
            $table->foreignId('requested_by_user_id')->constrained('users')->onDelete('restrict');
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('status', 50)->default('pending');
            $table->string('priority', 50)->default('normal');
            $table->date('needed_by_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('status');
            $table->index('location_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restock_requests');
    }
};