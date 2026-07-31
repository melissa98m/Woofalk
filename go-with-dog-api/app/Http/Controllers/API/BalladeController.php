<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\CachesListing;
use App\Http\Controllers\Controller;
use App\Models\Ballade;
use App\Models\Tag;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class BalladeController extends Controller
{
    use CachesListing;

    private const CACHE_KEY = 'ballades.index';

    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index()
    {
        $ballades = $this->rememberListing(self::CACHE_KEY, function () {
            // Cached as plain arrays rather than Eloquent models — see the
            // identical note in PlaceController::index(): hydrating full
            // models for every row and serializing them whole for the file
            // cache can exhaust the default memory_limit at scale, which
            // fails silently (a truncated payload, not an error) rather than
            // loudly. likes_count is deliberately NOT selected here: it
            // changes on every like/unlike, and baking it into the cached
            // payload would mean busting the whole list cache on every like
            // instead of only on ballade edits — it's merged in below.
            return Ballade::select(['id', 'ballade_name', 'ballade_description', 'ballade_image', 'ballade_website', 'distance', 'denivele', 'ballade_latitude', 'ballade_longitude', 'status', 'user', 'created_at'])
                ->with([
                    'user:id,username',
                    'tags:id,tag_name,color',
                ])
                ->get()
                ->toArray();
        });

        // is_liked/likes_count depend on live like state, so they're merged
        // in after the cache read rather than baked into the cached payload.
        $userId = Auth::id();
        $likedIds = $userId
            ? DB::table('ballade_likes')->where('user_id', $userId)->pluck('ballade_id')->all()
            : [];
        $likeCounts = DB::table('ballade_likes')
            ->selectRaw('ballade_id, count(*) as count')
            ->groupBy('ballade_id')
            ->pluck('count', 'ballade_id');
        $ballades = array_map(function ($ballade) use ($likedIds, $likeCounts) {
            $ballade['is_liked'] = in_array($ballade['id'], $likedIds, true);
            $ballade['likes_count'] = (int) ($likeCounts[$ballade['id']] ?? 0);

            return $ballade;
        }, $ballades);

        return response()->json([
            'status' => 'Success',
            'data' => $ballades,
        ]);
    }

    public function byUser()
    {
        $userId = Auth::id();
        $ballades = Ballade::with(['user', 'tags'])
            ->withCount('likedByUsers as likes_count')
            ->where('user', '=', $userId)
            ->get();
        $this->attachLikeState($ballades);

        return response()->json([
            'status' => 'Success',
            'data' => $ballades,
        ]);
    }

    /**
     * Display the ballades liked by the authenticated user.
     *
     * @return Response
     */
    public function likedByUser()
    {
        $ballades = Auth::user()->likedBallades()
            ->with(['user', 'tags'])
            ->withCount('likedByUsers as likes_count')
            ->get();
        $ballades->each(function (Ballade $ballade) {
            $ballade->is_liked = true;
        });

        return response()->json([
            'status' => 'Success',
            'data' => $ballades,
        ]);
    }

    /**
     * Like the specified resource on behalf of the authenticated user.
     *
     * @return Response
     */
    public function like(Ballade $ballade)
    {
        $ballade->likedByUsers()->syncWithoutDetaching([Auth::id()]);

        return response()->json([
            'status' => 'Success',
            'is_liked' => true,
            'likes_count' => $ballade->likedByUsers()->count(),
        ]);
    }

    /**
     * Remove the authenticated user's like from the specified resource.
     *
     * @return Response
     */
    public function unlike(Ballade $ballade)
    {
        $ballade->likedByUsers()->detach(Auth::id());

        return response()->json([
            'status' => 'Success',
            'is_liked' => false,
            'likes_count' => $ballade->likedByUsers()->count(),
        ]);
    }

    /**
     * Sync the user-selected tags plus the auto-computed difficulty
     * ("Facile"/"Moyen"/"Difficile" from dénivelé) and length
     * ("Court"/"Long" from distance) tags, so those two are always kept in
     * sync with the ballade's current distance/dénivelé instead of only
     * being set by the import scraper. sync() replaces the full pivot set,
     * so re-deriving both auto tags on every save also drops a now-stale one
     * (e.g. distance edited from 12km down to 8km: "Long" is removed, "Court"
     * added) without extra bookkeeping.
     */
    private function syncTagsWithAutoTags(Ballade $ballade, Request $request): void
    {
        $autoTagIds = array_map(
            fn (string $tagName) => Tag::firstOrCreateForScope($tagName, 'ballade')->id,
            Ballade::difficultyAndLengthTagNames($request->distance, $request->denivele)
        );

        $ballade->tags()->sync(array_values(array_unique(array_merge($request->input('tags', []), $autoTagIds))));
    }

    /**
     * Mark, without an extra query per row, which of the given ballades the
     * authenticated user (if any) has liked, and attach each one's live like
     * count (kept out of the cached listing query so a like/unlike doesn't
     * have to bust the whole list cache).
     *
     * @param  Collection<int, Ballade>  $ballades
     */
    private function attachLikeState(Collection $ballades): void
    {
        $userId = Auth::id();
        $likedIds = $userId
            ? DB::table('ballade_likes')->where('user_id', $userId)->pluck('ballade_id')->all()
            : [];
        $likeCounts = DB::table('ballade_likes')
            ->selectRaw('ballade_id, count(*) as count')
            ->groupBy('ballade_id')
            ->pluck('count', 'ballade_id');
        $ballades->each(function (Ballade $ballade) use ($likedIds, $likeCounts) {
            $ballade->is_liked = in_array($ballade->id, $likedIds, true);
            $ballade->likes_count = (int) ($likeCounts[$ballade->id] ?? 0);
        });
    }

    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function sortByDateDesc()
    {
        $balladesdesc = Ballade::with(['user', 'tags'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'Success',
            'data' => $balladesdesc,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return Response
     */
    public function store(Request $request)
    {
        $current = Auth::id();
        $request->validate([
            'ballade_name' => 'required|max:200',
            'ballade_description' => 'required',
            'distance' => 'nullable|numeric',
            'denivele' => 'nullable|integer',
            'ballade_image' => 'nullable|mimes:png,jpg,jpeg|max:2048',
            'ballade_website' => 'nullable|url|max:255',
            'ballade_latitude' => 'required|numeric|between:-90,90',
            'ballade_longitude' => 'required|numeric|between:-180,180',
            'status' => 'nullable|in:publie,en_attente',
            'tags' => 'nullable|array',
            'tags.*' => [
                'integer',
                Rule::exists('tags', 'id')->where(fn ($query) => $query->whereIn('scope', ['ballade', 'both'])),
            ],
        ]);
        if ($request->hasFile('ballade_image')) {
            $filename = $this->getFilename($request);
        } else {
            $filename = null;
        }
        $ballade = Ballade::create([
            'ballade_name' => $request->ballade_name,
            'ballade_description' => $request->ballade_description,
            'distance' => $request->distance,
            'denivele' => $request->denivele,
            'ballade_image' => $filename,
            'ballade_website' => $request->ballade_website,
            'ballade_latitude' => $request->ballade_latitude,
            'ballade_longitude' => $request->ballade_longitude,
            'user' => $current,
            'status' => $request->status ?? 'publie',
        ]);
        $this->syncTagsWithAutoTags($ballade, $request);
        $this->forgetListing(self::CACHE_KEY);

        $ballade->tags = $ballade->tags()->get();
        $ballade->user = $ballade->user()->get()[0];

        return response()->json([
            'status' => 'Success',
            'data' => $ballade,
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @return Response
     */
    public function show(Ballade $ballade)
    {
        $ballade->load(['user']);
        $ballade->load(['tags']);
        $ballade->loadCount('likedByUsers as likes_count');
        $userId = Auth::id();
        $ballade->is_liked = $userId ? $ballade->likedByUsers()->where('users.id', $userId)->exists() : false;

        return response()->json($ballade);
    }

    /**
     * Update the specified resource in storage.
     *
     * @return Response
     */
    public function update(Request $request, Ballade $ballade)
    {
        $current = Auth::id();
        $this->validate($request, [
            'ballade_name' => 'required|max:200',
            'ballade_description' => 'required',
            'distance' => 'nullable|numeric',
            'denivele' => 'nullable|integer',
            'ballade_image' => 'nullable|mimes:png,jpg,jpeg|max:2048',
            'ballade_website' => 'nullable|url|max:255',
            'ballade_latitude' => 'required|numeric|between:-90,90',
            'ballade_longitude' => 'required|numeric|between:-180,180',
            'status' => 'nullable|in:publie,en_attente',
            'tags' => 'nullable|array',
            'tags.*' => [
                'integer',
                Rule::exists('tags', 'id')->where(fn ($query) => $query->whereIn('scope', ['ballade', 'both'])),
            ],
        ]);

        if ($request->hasFile('ballade_image')) {
            if (Ballade::findOrFail($ballade->id)->ballade_image) {
                Storage::delete('/public/uploads/ballade/'.Ballade::findOrFail($ballade->id)->ballade_image);
            }
            $filename = $this->getFilename($request);
            $request->ballade_image = $filename;
        }

        if ($request->ballade_image == null) {
            $request->ballade_image = Ballade::findOrFail($ballade->id)->ballade_image;
        }

        $ballade->update([
            'ballade_name' => $request->ballade_name,
            'ballade_description' => $request->ballade_description,
            'distance' => $request->distance,
            'denivele' => $request->denivele,
            'ballade_image' => $request->ballade_image,
            'ballade_website' => $request->ballade_website,
            'ballade_latitude' => $request->ballade_latitude,
            'ballade_longitude' => $request->ballade_longitude,
            'user' => $current,
            'status' => $request->status ?? $ballade->status,
        ]);
        $this->syncTagsWithAutoTags($ballade, $request);
        $this->forgetListing(self::CACHE_KEY);

        $ballade->tags = $ballade->tags()->get();
        $ballade->user = $ballade->user()->get()[0];

        return response()->json([
            'status' => 'Mise à jour avec success',
            'data' => $ballade,
            'request' => $request->ballade_image,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return Response
     */
    public function destroy(Ballade $ballade)
    {
        if ($ballade->ballade_image) {
            Storage::delete('/public/uploads/ballades'.$ballade->ballade_image);
        }
        $ballade->delete();
        $this->forgetListing(self::CACHE_KEY);

        return response()->json([
            'status' => 'Supprimer avec success',
        ]);
    }

    /**
     * Bulk-update the moderation status of several ballades at once, used by
     * the admin dashboard's "select all / publish / set pending" toolbar.
     *
     * @return Response
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => ['integer', Rule::exists('ballades', 'id')],
            'status' => 'required|in:publie,en_attente',
        ]);

        Ballade::whereIn('id', $validated['ids'])->update(['status' => $validated['status']]);
        $this->forgetListing(self::CACHE_KEY);

        return response()->json(['status' => 'Success']);
    }

    /**
     * Bulk-delete several ballades at once, used by the admin dashboard's
     * "select all / delete" toolbar.
     *
     * @return Response
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => ['integer', Rule::exists('ballades', 'id')],
        ]);

        $ballades = Ballade::whereIn('id', $validated['ids'])->get(['id', 'ballade_image']);
        foreach ($ballades as $ballade) {
            if ($ballade->ballade_image) {
                Storage::delete('/public/uploads/ballades'.$ballade->ballade_image);
            }
        }

        Ballade::whereIn('id', $validated['ids'])->delete();
        $this->forgetListing(self::CACHE_KEY);

        return response()->json(['status' => 'Supprimer avec succès']);
    }

    public function getFilename(Request $request): string
    {
        $filenameWithExt = $request->file('ballade_image')->getClientOriginalName();
        $filenameWithoutExt = pathinfo($filenameWithExt, PATHINFO_FILENAME);
        $extension = $request->file('ballade_image')->getClientOriginalExtension();
        $filename = $filenameWithoutExt.'_'.time().'.'.$extension;
        $path = $request->file('ballade_image')->storeAs('public/uploads/ballades', $filename);

        return $filename;
    }
}
