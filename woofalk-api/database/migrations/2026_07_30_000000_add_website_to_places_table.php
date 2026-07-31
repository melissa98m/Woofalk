<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('places', function (Blueprint $table) {
            $table->string('place_website')->nullable()->after('place_image');
        });
    }

    public function down()
    {
        Schema::table('places', function (Blueprint $table) {
            $table->dropColumn('place_website');
        });
    }
};
