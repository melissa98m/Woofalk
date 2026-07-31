<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The emmenetonchien.com ballade scraper can't reliably find a distance/
 * dénivelé pair for every fiche (only free text in the description, not
 * structured data, and some fiches — parks, viewpoints — genuinely don't
 * have one) — nullable here so those import as "non renseigné" instead of
 * being skipped or given a misleading 0.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE ballades MODIFY distance INTEGER NULL');
        DB::statement('ALTER TABLE ballades MODIFY denivele INTEGER NULL');

        Schema::table('ballades', function (Blueprint $table) {
            $table->string('ballade_website')->nullable()->after('ballade_image');
        });
    }

    public function down(): void
    {
        Schema::table('ballades', function (Blueprint $table) {
            $table->dropColumn('ballade_website');
        });

        DB::statement('ALTER TABLE ballades MODIFY distance INTEGER NOT NULL');
        DB::statement('ALTER TABLE ballades MODIFY denivele INTEGER NOT NULL');
    }
};
