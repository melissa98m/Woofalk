<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Hebergement;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class HebergementController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index()
    {
        $hebergements = Hebergement::with(['user', 'category', 'address', 'tags'])->withCount('likedByUsers as likes_count')->get();
        $this->attachLikeState($hebergements);

        return response()->json([
            'status' => 'Success',
            'data' => $hebergements,
        ]);
    }

    public function byUser()
    {
        $userId = Auth::id();
        $hebergements = Hebergement::with(['user', 'category', 'address', 'tags'])
            ->withCount('likedByUsers as likes_count')
            ->where('user', '=', $userId)
            ->get();
        $this->attachLikeState($hebergements);

        return response()->json([
            'status' => 'Success',
            'data' => $hebergements,
        ]);
    }

    /**
     * Display the hebergements liked by the authenticated user.
     *
     * @return Response
     */
    public function likedByUser()
    {
        $hebergements = Auth::user()->likedHebergements()
            ->with(['user', 'category', 'address', 'tags'])
            ->withCount('likedByUsers as likes_count')
            ->get();
        $hebergements->each(function (Hebergement $hebergement) {
            $hebergement->is_liked = true;
        });

        return response()->json([
            'status' => 'Success',
            'data' => $hebergements,
        ]);
    }

    /**
     * Like the specified resource on behalf of the authenticated user.
     *
     * @return Response
     */
    public function like(Hebergement $hebergement)
    {
        $hebergement->likedByUsers()->syncWithoutDetaching([Auth::id()]);

        return response()->json([
            'status' => 'Success',
            'is_liked' => true,
            'likes_count' => $hebergement->likedByUsers()->count(),
        ]);
    }

    /**
     * Remove the authenticated user's like from the specified resource.
     *
     * @return Response
     */
    public function unlike(Hebergement $hebergement)
    {
        $hebergement->likedByUsers()->detach(Auth::id());

        return response()->json([
            'status' => 'Success',
            'is_liked' => false,
            'likes_count' => $hebergement->likedByUsers()->count(),
        ]);
    }

    /**
     * Mark, without an extra query per row, which of the given hebergements the
     * authenticated user (if any) has liked.
     *
     * @param  Collection<int, Hebergement>  $hebergements
     */
    private function attachLikeState(Collection $hebergements): void
    {
        $userId = Auth::id();
        $likedIds = $userId
            ? DB::table('hebergement_likes')->where('user_id', $userId)->pluck('hebergement_id')->all()
            : [];
        $hebergements->each(function (Hebergement $hebergement) use ($likedIds) {
            $hebergement->is_liked = in_array($hebergement->id, $likedIds, true);
        });
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
            'hebergement_name' => 'required|max:200',
            'hebergement_description' => 'required',
            'hebergement_image' => 'nullable|mimes:png,jpg,jpeg|max:2048',
            'hebergement_website' => 'nullable|url|max:255',
            'price_indication' => 'nullable|max:100',
            'category' => 'required',
            'address' => 'required',
            'status' => 'nullable|in:publie,en_attente',
            'tags' => 'nullable|array',
            'tags.*' => [
                'integer',
                Rule::exists('tags', 'id')->where(fn ($query) => $query->whereIn('scope', ['hebergement', 'both'])),
            ],
        ]);
        if ($request->hasFile('hebergement_image')) {
            $filename = $this->getFilename($request);
        } else {
            $filename = null;
        }
        $hebergement = Hebergement::create([
            'hebergement_name' => $request->hebergement_name,
            'hebergement_description' => $request->hebergement_description,
            'hebergement_image' => $filename,
            'hebergement_website' => $request->hebergement_website,
            'price_indication' => $request->price_indication,
            'address' => $request->address,
            'category' => $request->category,
            'user' => $current,
            'status' => $request->status ?? 'publie',
        ]);
        $hebergement->tags()->sync($request->input('tags', []));

        $hebergement->address = $hebergement->address()->get()[0];
        $hebergement->category = $hebergement->category()->get()[0];
        $hebergement->user = $hebergement->user()->get()[0];
        $hebergement->tags = $hebergement->tags()->get();

        return response()->json([
            'status' => 'Success',
            'data' => $hebergement,
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @return Response
     */
    public function show(Hebergement $hebergement)
    {
        $hebergement->load(['user']);
        $hebergement->load(['category']);
        $hebergement->load(['address']);
        $hebergement->load(['tags']);
        $hebergement->loadCount('likedByUsers as likes_count');
        $userId = Auth::id();
        $hebergement->is_liked = $userId ? $hebergement->likedByUsers()->where('users.id', $userId)->exists() : false;

        return response()->json($hebergement);
    }

    /**
     * Update the specified resource in storage.
     *
     * @return Response
     */
    public function update(Request $request, Hebergement $hebergement)
    {
        $current = Auth::id();
        $this->validate($request, [
            'hebergement_name' => 'required|max:200',
            'hebergement_description' => 'required',
            'hebergement_image' => 'nullable|mimes:png,jpg,jpeg|max:2048',
            'hebergement_website' => 'nullable|url|max:255',
            'price_indication' => 'nullable|max:100',
            'category' => 'required',
            'address' => 'required',
            'status' => 'nullable|in:publie,en_attente',
            'tags' => 'nullable|array',
            'tags.*' => [
                'integer',
                Rule::exists('tags', 'id')->where(fn ($query) => $query->whereIn('scope', ['hebergement', 'both'])),
            ],
        ]);
        if ($request->hasFile('hebergement_image')) {
            if (Hebergement::findOrFail($hebergement->id)->hebergement_image) {
                Storage::delete('/public/uploads/hebergements/'.Hebergement::findOrFail($hebergement->id)->hebergement_image);
            }
            $filename = $this->getFilename($request);
            $request->hebergement_image = $filename;
        }
        if ($request->hebergement_image == null) {
            $request->hebergement_image = Hebergement::findOrFail($hebergement->id)->hebergement_image;
        }
        $hebergement->update([
            'hebergement_name' => $request->hebergement_name,
            'hebergement_description' => $request->hebergement_description,
            'hebergement_image' => $request->hebergement_image,
            'hebergement_website' => $request->hebergement_website,
            'price_indication' => $request->price_indication,
            'address' => $request->address,
            'category' => $request->category,
            'user' => $current,
            'status' => $request->status ?? $hebergement->status,
        ]);
        $hebergement->tags()->sync($request->input('tags', []));

        $hebergement->address = $hebergement->address()->get()[0];
        $hebergement->category = $hebergement->category()->get()[0];
        $hebergement->user = $hebergement->user()->get()[0];
        $hebergement->tags = $hebergement->tags()->get();

        return response()->json([
            'status' => 'Mise à jour avec succèss',
            'data' => $hebergement,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return Response
     */
    public function destroy(Hebergement $hebergement)
    {
        if ($hebergement->hebergement_image) {
            Storage::delete('/public/uploads/hebergements/'.$hebergement->hebergement_image);
        }
        $hebergement->delete();

        return response()->json([
            'status' => 'Supprimer avec succès',
        ]);
    }

    /**
     * Bulk-update the moderation status of several hebergements at once, used by
     * the admin dashboard's "select all / publish / set pending" toolbar.
     *
     * @return Response
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => ['integer', Rule::exists('hebergements', 'id')],
            'status' => 'required|in:publie,en_attente',
        ]);

        Hebergement::whereIn('id', $validated['ids'])->update(['status' => $validated['status']]);

        return response()->json(['status' => 'Success']);
    }

    /**
     * Bulk-delete several hebergements at once, used by the admin dashboard's
     * "select all / delete" toolbar.
     *
     * @return Response
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => ['integer', Rule::exists('hebergements', 'id')],
        ]);

        $hebergements = Hebergement::whereIn('id', $validated['ids'])->get();
        foreach ($hebergements as $hebergement) {
            if ($hebergement->hebergement_image) {
                Storage::delete('/public/uploads/hebergements/'.$hebergement->hebergement_image);
            }
        }
        Hebergement::whereIn('id', $validated['ids'])->delete();

        return response()->json(['status' => 'Supprimer avec succès']);
    }

    public function getFilename(Request $request): string
    {
        $filenameWithExt = $request->file('hebergement_image')->getClientOriginalName();
        $filenameWithoutExt = pathinfo($filenameWithExt, PATHINFO_FILENAME);
        $extension = $request->file('hebergement_image')->getClientOriginalExtension();
        $filename = $filenameWithoutExt.'_'.time().'.'.$extension;
        $request->file('hebergement_image')->storeAs('public/uploads/hebergements', $filename);

        return $filename;
    }
}
