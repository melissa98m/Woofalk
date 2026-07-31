<?php

namespace App\Http\Controllers\API\Concerns;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Caches the heavy `index` queries (eager-loaded relations + counts) shared
 * by the Place/Hebergement/Ballade/Category/Tag/Address controllers.
 *
 * Same-resource mutations (store/update/destroy/bulk actions/like/unlike)
 * call forgetListing() to invalidate immediately. Cross-resource staleness (e.g.
 * renaming a Category that's embedded in the cached Place listing) is not
 * explicitly invalidated — the short TTL below is the safety net for that
 * case instead, to avoid coupling every controller to every other one.
 */
trait CachesListing
{
    protected int $listingCacheTtl = 900; // 15 min safety net, see class docblock

    protected function rememberListing(string $key, \Closure $callback): mixed
    {
        return Cache::remember($key, $this->listingCacheTtl, $callback);
    }

    protected function forgetListing(string ...$keys): void
    {
        foreach ($keys as $key) {
            Cache::forget($key);
        }
    }

    /**
     * Fetch a many-to-many tag relation via the pivot table directly, as
     * plain arrays grouped by owner id — some rows (e.g. scraped
     * hebergements) carry dozens of tags each, and letting Eloquent
     * eager-load a full Tag model per pivot row for every listed record
     * multiplies into enough object overhead to exhaust memory_limit on
     * large listings. A grouped query-builder pass avoids hydrating any
     * Tag models at all.
     *
     * @return Collection<int, list<array{id: int, tag_name: string, color: string}>>
     */
    protected function groupTagsByOwner(string $pivotTable, string $ownerColumn): Collection
    {
        return DB::table($pivotTable)
            ->join('tags', 'tags.id', '=', "{$pivotTable}.tag_id")
            ->select("{$pivotTable}.{$ownerColumn} as owner_id", 'tags.id', 'tags.tag_name', 'tags.color')
            ->orderBy('tags.tag_name')
            ->get()
            ->groupBy('owner_id')
            ->map(fn ($rows) => $rows->map(fn ($row) => [
                'id' => $row->id,
                'tag_name' => $row->tag_name,
                'color' => $row->color,
            ])->values()->all());
    }
}
