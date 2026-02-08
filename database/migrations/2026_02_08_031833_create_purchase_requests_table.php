<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->string('pr_number')->unique();
            $table->unsignedBigInteger('requested_by_user_id');
            $table->string('status', 50)->default('draft');
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->dateTime('requested_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->dateTime('admin_action_at')->nullable();
            $table->unsignedBigInteger('admin_user_id')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->date('expected_delivery_date')->nullable();
            $table->dateTime('supplier_contacted_at')->nullable();
            $table->decimal('total_estimated_cost', 12, 2)->nullable();
            $table->string('currency', 6)->default('PHP');
            $table->timestamps();

            $table->foreign('requested_by_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('admin_user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
            $table->index('status');
            $table->index('requested_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_requests');
    }
};
