<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('stock_variance_investigations')) {
            Schema::create('stock_variance_investigations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('stock_count_id');
                $table->unsignedBigInteger('product_variant_id');
                $table->unsignedBigInteger('location_id');

                $table->integer('variance_qty');
                $table->enum('variance_direction', ['excess', 'shortage']);
                $table->integer('system_qty');
                $table->integer('counted_qty');

                $table->string('status', 50)->default('new');
                $table->text('investigation_notes')->nullable();

                $table->unsignedBigInteger('assigned_to_user_id')->nullable();
                $table->unsignedBigInteger('investigated_by_user_id')->nullable();
                $table->string('root_cause', 50)->nullable();
                $table->text('action_taken')->nullable();

                $table->unsignedBigInteger('approved_by_user_id')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->text('approval_notes')->nullable();

                $table->integer('adjustment_qty')->nullable();
                $table->text('write_off_reason')->nullable();
                $table->decimal('cost_impact', 12, 2)->nullable();
                $table->timestamp('resolution_date')->nullable();

                $table->unsignedBigInteger('created_by_user_id');

                $table->timestamps();

                $table->foreign('stock_count_id')->references('id')->on('stock_counts')->onDelete('cascade');
                $table->foreign('product_variant_id')->references('id')->on('product_variants')->onDelete('restrict');
                $table->foreign('location_id')->references('id')->on('locations')->onDelete('restrict');
                $table->foreign('assigned_to_user_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('investigated_by_user_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('approved_by_user_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('restrict');

                $table->index(['status', 'assigned_to_user_id'], 'svi_status_assigned_to_idx');
                $table->index(['variance_direction', 'root_cause'], 'svi_variance_direction_root_cause_idx');
                $table->index(['location_id', 'created_at'], 'svi_location_created_at_idx');
            });
        }

        if (!Schema::hasTable('variance_investigation_notes')) {
            Schema::create('variance_investigation_notes', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('stock_variance_investigation_id');
                $table->text('note_text');
                $table->enum('note_type', ['investigation', 'finding', 'decision', 'resolution'])->default('investigation');
                $table->unsignedBigInteger('created_by_user_id');
                $table->timestamps();

                $table->foreign('stock_variance_investigation_id', 'vin_svi_id_foreign')->references('id')->on('stock_variance_investigations')->onDelete('cascade');
                $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('restrict');

                $table->index(['stock_variance_investigation_id', 'created_at'], 'vin_investigation_created_at_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('variance_investigation_notes');
        Schema::dropIfExists('stock_variance_investigations');
    }
};
