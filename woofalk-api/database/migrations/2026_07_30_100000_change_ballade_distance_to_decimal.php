<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Ballade distances aren't always whole kilometers (e.g. "8,4 km" on the
 * source sites the scraper imports from) — INTEGER was silently truncating
 * them, so this switches the column to a one-decimal DECIMAL.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE ballades MODIFY distance DECIMAL(5,1) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE ballades MODIFY distance INTEGER NULL');
    }
};
