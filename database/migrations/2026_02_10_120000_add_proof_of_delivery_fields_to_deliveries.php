<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->text('proof_photo_url')->nullable();
            $table->text('proof_signature_url')->nullable();
            $table->decimal('proof_geo_lat', 10, 7)->nullable();
            $table->decimal('proof_geo_lng', 10, 7)->nullable();
            $table->dateTime('proof_captured_at')->nullable();
            $table->text('proof_exceptions')->nullable();
            $table->json('delivered_items')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropColumn([
                'proof_photo_url',
                'proof_signature_url',
                'proof_geo_lat',
                'proof_geo_lng',
                'proof_captured_at',
                'proof_exceptions',
                'delivered_items',
            ]);
        });
    }
};
