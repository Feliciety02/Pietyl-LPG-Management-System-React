<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type'); // 'low_stock', 'purchase_approval_needed', etc.
            $table->string('title');
            $table->text('message');
            $table->string('entity_type')->nullable(); // 'InventoryBalance', 'Purchase', etc.
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('data')->nullable(); // Additional context
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->string('channel')->default('database'); // 'database', 'email', 'sms'
            $table->boolean('delivery_success')->default(false);
            $table->text('delivery_error')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('user_id');
            $table->index('is_read');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
