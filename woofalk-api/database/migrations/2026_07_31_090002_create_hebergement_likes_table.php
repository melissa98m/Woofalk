<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hebergement_likes', function (Blueprint $table) {
            $table->foreignId('hebergement_id')->constrained()->cascadeOnDelete();
            // users.id is a plain `increments` (INT UNSIGNED), not `id()` (BIGINT UNSIGNED) like every
            // other table here, so foreignId()->constrained() would mismatch types on the FK — match it explicitly.
            $table->unsignedInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['hebergement_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hebergement_likes');
    }
};
