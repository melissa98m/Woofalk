<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Default 'place': every category created before this migration
            // was created for/by the place scraper and admin UI.
            $table->enum('scope', ['place', 'hebergement', 'both'])->default('place')->after('category_name');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('scope');
        });
    }
};
