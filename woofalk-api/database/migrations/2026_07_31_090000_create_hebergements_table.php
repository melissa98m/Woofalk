<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hebergements', function (Blueprint $table) {
            $table->id();
            $table->string('hebergement_name');
            $table->longText('hebergement_description');
            $table->string('hebergement_image')->nullable();
            $table->string('hebergement_website')->nullable();
            // Free text ("40€/jour", "25€/nuit", …) — scraped tariffs are too
            // heterogeneous for a structured price column.
            $table->string('price_indication')->nullable();
            $table->foreignId('address')->constrained('addresses');
            $table->foreignId('category')->constrained('categories');
            // Nullable + plain unsignedBigInteger (not foreignId/constrained):
            // same GDPR-driven choice as places.user/ballades.user — anonymize
            // instead of cascade-deleting content when an account is erased.
            $table->unsignedBigInteger('user')->nullable();
            $table->string('status')->default('publie');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hebergements');
    }
};
