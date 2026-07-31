<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The original contacts migration never defined a primary key, so
 * individual messages have never been addressable by id (only listable
 * as a whole). Needed to let admins reply to one specific message.
 */
return new class extends Migration
{
    public function up()
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->id()->first();
        });
    }

    public function down()
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn('id');
        });
    }
};
