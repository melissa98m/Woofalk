<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE tags MODIFY scope ENUM('place', 'ballade', 'hebergement', 'both') DEFAULT 'both'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE tags MODIFY scope ENUM('place', 'ballade', 'both') DEFAULT 'both'");
    }
};
