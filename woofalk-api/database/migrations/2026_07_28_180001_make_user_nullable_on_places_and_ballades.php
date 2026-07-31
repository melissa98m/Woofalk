<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets a deleted account's places/ballades survive as anonymous public
 * content (GDPR right-to-erasure: erase the account, not the place data)
 * instead of being left with a dangling reference to a deleted user row.
 *
 * Kept as unsignedBigInteger rather than switching to foreignId(): `user`
 * was never a real FK-constrained column (users.id is a legacy increments()/
 * INT UNSIGNED column, same mismatch already noted in the place_likes/
 * ballade_likes migrations), so this only relaxes the NOT NULL constraint
 * without trying to reconcile that pre-existing type mismatch.
 */
return new class extends Migration
{
    public function up()
    {
        Schema::table('places', function (Blueprint $table) {
            $table->unsignedBigInteger('user')->nullable()->change();
        });
        Schema::table('ballades', function (Blueprint $table) {
            $table->unsignedBigInteger('user')->nullable()->change();
        });
    }

    public function down()
    {
        // Only safe if no row has been anonymized (user IS NULL) since this
        // migration ran — re-adding NOT NULL will fail otherwise. Forward-fix
        // in production rather than relying on this rollback.
        Schema::table('places', function (Blueprint $table) {
            $table->unsignedBigInteger('user')->nullable(false)->change();
        });
        Schema::table('ballades', function (Blueprint $table) {
            $table->unsignedBigInteger('user')->nullable(false)->change();
        });
    }
};
