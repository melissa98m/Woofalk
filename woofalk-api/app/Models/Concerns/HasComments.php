<?php

namespace App\Models\Concerns;

use App\Models\Comment;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Shared by Place/Ballade/Hebergement: user-submitted comments against that
 * specific record, and cleanup when the record is deleted.
 */
trait HasComments
{
    public static function bootHasComments(): void
    {
        // delete() (used by destroy()) fires Eloquent events, so this hook
        // covers it; bulk query-builder deletes (bulkDestroy()) don't fire
        // model events and clean up their comments explicitly instead.
        static::deleting(function ($model) {
            $model->comments()->delete();
        });
    }

    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
