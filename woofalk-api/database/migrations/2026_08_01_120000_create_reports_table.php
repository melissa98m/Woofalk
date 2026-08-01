<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->morphs('reportable');
            // users.id is a plain `increments` (INT UNSIGNED), not `id()` (BIGINT UNSIGNED) like every
            // other table here, so foreignId()->constrained() would mismatch types on the FK — match it explicitly.
            $table->unsignedInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('subject', 120);
            $table->text('message')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->unique(['reportable_type', 'reportable_id', 'user_id'], 'reports_reportable_user_unique');
        });
    }

    public function down()
    {
        Schema::dropIfExists('reports');
    }
};
