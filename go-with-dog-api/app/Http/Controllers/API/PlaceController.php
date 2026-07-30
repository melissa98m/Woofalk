<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Place;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PlaceController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index()
    {
        $places = Place::with(['user', 'category', 'address', 'tags'])->withCount('likedByUsers as likes_count')->get();
        $this->attachLikeState($places);

        return response()->json([
            'status' => 'Success',
            'data' => $places,
        ]);
    }

    public function byUser()
    {
        $userId = Auth::id();
        $places = Place::with(['user', 'category', 'address', 'tags'])
            ->withCount('likedByUsers as likes_count')
            ->where('user', '=', $userId)
            ->get();
        $this->attachLikeState($places);

        return response()->json([
            'status' => 'Success',
            'data' => $places,
        ]);
    }

    /**
     * Display the places liked by the authenticated user.
     *
     * @return Response
     */
    public function likedByUser()
    {
        $places = Auth::user()->likedPlaces()
            ->with(['user', 'category', 'address', 'tags'])
            ->withCount('likedByUsers as likes_count')
            ->get();
        $places->each(function (Place $place) {
            $place->is_liked = true;
        });

        return response()->json([
            'status' => 'Success',
            'data' => $places,
        ]);
    }

    /**
     * Like the specified resource on behalf of the authenticated user.
     *
     * @return Response
     */
    public function like(Place $place)
    {
        $place->likedByUsers()->syncWithoutDetaching([Auth::id()]);

        return response()->json([
            'status' => 'Success',
            'is_liked' => true,
            'likes_count' => $place->likedByUsers()->count(),
        ]);
    }

    /**
     * Remove the authenticated user's like from the specified resource.
     *
     * @return Response
     */
    public function unlike(Place $place)
    {
        $place->likedByUsers()->detach(Auth::id());

        return response()->json([
            'status' => 'Success',
            'is_liked' => false,
            'likes_count' => $place->likedByUsers()->count(),
        ]);
    }

    /**
     * Mark, without an extra query per row, which of the given places the
     * authenticated user (if any) has liked.
     *
     * @param  Collection<int, Place>  $places
     */
    private function attachLikeState(Collection $places): void
    {
        $userId = Auth::id();
        $likedIds = $userId
            ? DB::table('place_likes')->where('user_id', $userId)->pluck('place_id')->all()
            : [];
        $places->each(function (Place $place) use ($likedIds) {
            $place->is_liked = in_array($place->id, $likedIds, true);
        });
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return Response
     */
    public function store(Request $request)
    {
        $current = Auth::id(); // recupere l'id du current user

        $request->validate([
            'place_name' => 'required|max:200',
            'place_description' => 'required',
            'place_image' => 'nullable|mimes:png,jpg,jpeg|max:2048',
            'category' => 'required',
            'address' => 'required',
            'status' => 'nullable|in:publie,en_attente',
            'tags' => 'nullable|array',
            'tags.*' => [
                'integer',
                Rule::exists('tags', 'id')->where(fn ($query) => $query->whereIn('scope', ['place', 'both'])),
            ],
        ]);
        if ($request->hasFile('place_image')) {
            $filename = $this->getFilename($request);
        } else {
            $filename = null;
        }
        $place = Place::create([
            'place_name' => $request->place_name,
            'place_description' => $request->place_description,
            'place_image' => $filename,
            'address' => $request->address,
            'category' => $request->category,
            'user' => $current,
            'status' => $request->status ?? 'publie',
        ]);
        $place->tags()->sync($request->input('tags', []));

        $place->address = $place->address()->get()[0];
        $place->category = $place->category()->get()[0];
        $place->user = $place->user()->get()[0];
        $place->tags = $place->tags()->get();

        return response()->json([
            'status' => 'Success',
            'data' => $place,
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @return Response
     */
    public function show(Place $place)
    {
        $place->load(['user']);
        $place->load(['category']);
        $place->load(['address']);
        $place->load(['tags']);
        $place->loadCount('likedByUsers as likes_count');
        $userId = Auth::id();
        $place->is_liked = $userId ? $place->likedByUsers()->where('users.id', $userId)->exists() : false;

        return response()->json($place);
    }

    /**
     * Update the specified resource in storage.
     *
     * @return Response
     */
    public function update(Request $request, Place $place)
    {
        $current = Auth::id();
        $this->validate($request, [
            'place_name' => 'required|max:200',
            'place_description' => 'required',
            'place_image' => 'nullable|mimes:png,jpg,jpeg|max:2048',
            'category' => 'required',
            'address' => 'required',
            'status' => 'nullable|in:publie,en_attente',
            'tags' => 'nullable|array',
            'tags.*' => [
                'integer',
                Rule::exists('tags', 'id')->where(fn ($query) => $query->whereIn('scope', ['place', 'both'])),
            ],
        ]);
        if ($request->hasFile('place_image')) {
            if (Place::findOrFail($place->id)->place_image) {
                Storage::delete('/public/uploads/places/'.Place::findOrFail($place->id)->place_image);
            }
            $filename = $this->getFilename($request);
            $request->place_image = $filename;
        }
        if ($request->place_image == null) {
            $request->place_image = Place::findOrFail($place->id)->place_image;
        }
        $place->update([
            'place_name' => $request->place_name,
            'place_description' => $request->place_description,
            'place_image' => $request->place_image,
            'address' => $request->address,
            'category' => $request->category,
            'user' => $current,
            'status' => $request->status ?? $place->status,
        ]);
        $place->tags()->sync($request->input('tags', []));

        $place->address = $place->address()->get()[0];
        $place->category = $place->category()->get()[0];
        $place->user = $place->user()->get()[0];
        $place->tags = $place->tags()->get();

        return response()->json([
            'status' => 'Mise à jour avec succèss',
            'data' => $place,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return Response
     */
    public function destroy(Place $place)
    {
        $place->delete();

        return response()->json([
            'status' => 'Supprimer avec succès',
        ]);
    }

    public function getFilename(Request $request): string
    {
        $filenameWithExt = $request->file('place_image')->getClientOriginalName();
        $filenameWithoutExt = pathinfo($filenameWithExt, PATHINFO_FILENAME);
        $extension = $request->file('place_image')->getClientOriginalExtension();
        $filename = $filenameWithoutExt.'_'.time().'.'.$extension;
        $path = $request->file('place_image')->storeAs('public/uploads/places', $filename);

        return $filename;
    }
}
