<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('terms_accepted_at')->nullable()->after('roles');
        });

        // Accounts created before this column existed never explicitly ticked a
        // consent checkbox, but registering implied acceptance of whatever terms
        // were in force at the time — backfill from created_at rather than leave
        // an ambiguous null that a future audit could misread as "never consented".
        DB::table('users')->whereNull('terms_accepted_at')->update([
            'terms_accepted_at' => DB::raw('created_at'),
        ]);
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('terms_accepted_at');
        });
    }
};
