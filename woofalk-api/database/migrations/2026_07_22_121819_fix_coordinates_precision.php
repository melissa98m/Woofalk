<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        DB::statement('ALTER TABLE addresses MODIFY latitude DECIMAL(10,7) NOT NULL');
        DB::statement('ALTER TABLE addresses MODIFY longitude DECIMAL(10,7) NOT NULL');
        DB::statement('ALTER TABLE ballades MODIFY ballade_latitude DECIMAL(10,7) NOT NULL');
        DB::statement('ALTER TABLE ballades MODIFY ballade_longitude DECIMAL(10,7) NOT NULL');
    }

    public function down()
    {
        DB::statement('ALTER TABLE addresses MODIFY latitude INTEGER NOT NULL');
        DB::statement('ALTER TABLE addresses MODIFY longitude INTEGER NOT NULL');
        DB::statement('ALTER TABLE ballades MODIFY ballade_latitude INTEGER NOT NULL');
        DB::statement('ALTER TABLE ballades MODIFY ballade_longitude INTEGER NOT NULL');
    }
};
