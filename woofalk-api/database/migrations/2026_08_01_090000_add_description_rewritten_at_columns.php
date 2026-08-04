<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['places', 'ballades', 'hebergements'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->timestamp('description_rewritten_at')->nullable()->after('status');
            });
        }
    }

    public function down(): void
    {
        foreach (['places', 'ballades', 'hebergements'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropColumn('description_rewritten_at');
            });
        }
    }
};
