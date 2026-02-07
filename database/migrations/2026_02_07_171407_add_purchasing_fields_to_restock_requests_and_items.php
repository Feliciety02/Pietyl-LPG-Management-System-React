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
        Schema::table('restock_requests', function (Blueprint $table) {
            $table->foreignId('supplier_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('submitted_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('received_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('receiving_started_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->string('supplier_invoice_ref', 100)->nullable();
            $table->date('supplier_invoice_date')->nullable();
            $table->decimal('subtotal_cost', 15, 2)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->foreignId('supplier_payable_id')->nullable()->constrained()->onDelete('set null');

            $table->index(['status', 'supplier_id']);
        });

        Schema::table('restock_request_items', function (Blueprint $table) {
            $table->decimal('approved_qty', 12, 3)->default(0);
            $table->decimal('received_qty', 12, 3)->default(0);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);
        });

        DB::table('restock_requests')
            ->where('status', 'pending')
            ->update([
                'status' => 'submitted',
                'submitted_at' => DB::raw('created_at'),
                'submitted_by_user_id' => DB::raw('requested_by_user_id'),
            ]);

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('restock_request_items', function (Blueprint $table) {
            $table->dropColumn(['approved_qty', 'received_qty', 'unit_cost', 'line_total']);
        });

        Schema::table('restock_requests', function (Blueprint $table) {
            $table->dropForeign(['supplier_payable_id']);
            $table->dropForeign(['received_by_user_id']);
            $table->dropForeign(['submitted_by_user_id']);
            $table->dropForeign(['supplier_id']);
            $table->dropColumn([
                'supplier_payable_id',
                'received_by_user_id',
                'received_at',
                'receiving_started_at',
                'submitted_at',
                'submitted_by_user_id',
                'approved_at',
                'supplier_invoice_ref',
                'supplier_invoice_date',
                'subtotal_cost',
                'total_cost',
                'supplier_id',
            ]);
        });
    }
};
