<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Booking/affiliate URLs on emmenetonchien.com fiches routinely exceed
        // 255 chars (long tracking query strings) — VARCHAR(255) truncated
        // the whole import mid-run on the first one that did.
        DB::statement('ALTER TABLE hebergements MODIFY hebergement_website TEXT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE hebergements MODIFY hebergement_website VARCHAR(255) NULL');
    }
};
