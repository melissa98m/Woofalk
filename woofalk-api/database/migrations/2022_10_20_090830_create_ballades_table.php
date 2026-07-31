<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('ballades', function (Blueprint $table) {
            $table->id();
            $table->string('ballade_name');
            $table->integer('distance');
            $table->integer('denivele');
            $table->longText('ballade_description');
            $table->string('ballade_image')->nullable();
            $table->integer('ballade_latitude');
            $table->integer('ballade_longitude');
            $table->foreignId('user');
            $table->foreignId('tag');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('ballades');
    }
};
