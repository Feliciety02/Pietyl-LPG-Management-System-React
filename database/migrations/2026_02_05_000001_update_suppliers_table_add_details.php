<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            if (!Schema::hasColumn('suppliers', 'contact_name')) {
                $table->string('contact_name')->nullable()->after('name');
            }
            if (!Schema::hasColumn('suppliers', 'notes')) {
                $table->text('notes')->nullable()->after('address');
            }
            if (!Schema::hasColumn('suppliers', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('is_active');
                $table->index('archived_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            if (Schema::hasColumn('suppliers', 'archived_at')) {
                $table->dropIndex(['archived_at']);
                $table->dropColumn('archived_at');
            }
            if (Schema::hasColumn('suppliers', 'notes')) {
                $table->dropColumn('notes');
            }
            if (Schema::hasColumn('suppliers', 'contact_name')) {
                $table->dropColumn('contact_name');
            }
        });
    }
};
