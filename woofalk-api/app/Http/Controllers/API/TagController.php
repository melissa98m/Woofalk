<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\CachesListing;
use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class TagController extends Controller
{
    use CachesListing;

    /**
     * One cache entry per `scope` filter value, so a mutation must clear
     * every variant since we don't know which ones were affected.
     */
    private const CACHE_KEYS = ['tags.index', 'tags.index.place', 'tags.index.ballade', 'tags.index.hebergement', 'tags.index.both'];

    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index(Request $request)
    {
        $request->validate([
            'scope' => 'nullable|in:place,ballade,hebergement,both',
        ]);

        $cacheKey = 'tags.index'.($request->filled('scope') ? '.'.$request->scope : '');
        $tags = $this->rememberListing($cacheKey, function () use ($request) {
            $query = DB::table('tags');
            if ($request->filled('scope')) {
                $query->whereIn('scope', [$request->scope, 'both']);
            }

            return $query->get()->toArray();
        });

        return response()->json(['status' => 'Success', 'data' => $tags]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return Response
     */
    public function store(Request $request)
    {
        $request->validate([
            'tag_name' => 'required|max:50',
            'color' => 'required|max:10',
            'scope' => 'nullable|in:place,ballade,hebergement,both',
        ]);
        $tag = Tag::create([
            'tag_name' => $request->tag_name,
            'color' => $request->color,
            'scope' => $request->scope ?? 'both',
        ]);
        $this->forgetListing(...self::CACHE_KEYS);

        return response()->json(['status' => 'Success', 'data' => $tag]);
    }

    /**
     * Display the specified resource.
     *
     * @return Response
     */
    public function show(Tag $tag)
    {
        return response()->json($tag);
    }

    /**
     * Update the specified resource in storage.
     *
     * @return Response
     */
    public function update(Request $request, Tag $tag)
    {
        $this->validate($request, [
            'tag_name' => 'required|max:50',
            'color' => 'required|max:10',
            'scope' => 'nullable|in:place,ballade,hebergement,both',

        ]);
        $tag->update([
            'tag_name' => $request->tag_name,
            'color' => $request->color,
            'scope' => $request->scope ?? $tag->scope,
        ]);

        if ($tag->scope !== 'place' && $tag->scope !== 'both') {
            $tag->places()->detach();
        }
        if ($tag->scope !== 'ballade' && $tag->scope !== 'both') {
            $tag->ballades()->detach();
        }
        if ($tag->scope !== 'hebergement' && $tag->scope !== 'both') {
            $tag->hebergements()->detach();
        }
        $this->forgetListing(...self::CACHE_KEYS);

        return response()->json(['status' => 'Success', 'data' => $tag]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return Response
     */
    public function destroy(Tag $tag)
    {
        $tag->delete();
        $this->forgetListing(...self::CACHE_KEYS);

        return response()->json(['status' => 'Supprimer avec succès']);
    }

    /**
     * Bulk-delete several tags at once, used by the admin dashboard's
     * "select all / delete" toolbar.
     *
     * @return Response
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:tags,id',
        ]);

        Tag::whereIn('id', $validated['ids'])->delete();
        $this->forgetListing(...self::CACHE_KEYS);

        return response()->json(['status' => 'Supprimer avec succès']);
    }
}
