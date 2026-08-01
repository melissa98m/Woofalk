<?php

namespace App\Models\Concerns;

use App\Models\Report;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Shared by Place/Ballade/Hebergement: user-submitted reports ("signalements")
 * against that specific record, and cleanup when the record is deleted.
 */
trait HasReports
{
    public static function bootHasReports(): void
    {
        // delete() (used by destroy()) fires Eloquent events, so this hook
        // covers it; bulk query-builder deletes (bulkDestroy()) don't fire
        // model events and clean up their reports explicitly instead.
        static::deleting(function ($model) {
            $model->reports()->delete();
        });
    }

    public function reports(): MorphMany
    {
        return $this->morphMany(Report::class, 'reportable');
    }
}
