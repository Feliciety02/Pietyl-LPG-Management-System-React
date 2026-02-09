<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payable_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_payable_id')->constrained('supplier_payables')->onDelete('cascade');
            $table->string('entry_type', 60);
            $table->decimal('amount', 12, 2)->nullable()->default(0);
            $table->string('reference')->nullable();
            $table->json('meta')->nullable();
            $table->text('note')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payable_ledgers');
    }
};
