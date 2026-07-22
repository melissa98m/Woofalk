<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Place;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PlaceController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $places = Place::with(['user', 'category' , 'address'])->get();
        return response()->json([
            'status' => 'Success',
            'data' => $places
        ]);
    }
    public function byUser()
    {
        $userId = Auth::id();
        $places = Place::with(['user', 'category' , 'address'])
            ->where('user', '=', $userId)
            ->get();
        return response()->json([
            'status' => 'Success',
            'data' => $places,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
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
        ]);
        if ($request->hasFile('place_image')) {
            $filename = $this->getFilename($request);
        } else {
            $filename = Null;
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

        $place->address = $place->address()->get()[0];
        $place->category = $place->category()->get()[0];
       $place->user = $place->user()->get()[0];
        return response()->json([
            'status' => 'Success',
            'data' => $place,
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Place  $place
     * @return \Illuminate\Http\Response
     */
    public function show(Place $place)
    {
        $place->load(['user']);
        $place->load(['category']);
        $place->load(['address']);
        return response()->json($place);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Place  $place
     * @return \Illuminate\Http\Response
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
        ]);
        if ($request->hasFile('place_image')) {
            if (Place::findOrFail($place->id)->place_image){
                Storage::delete("/public/uploads/places/".Place::findOrFail($place->id)->place_image);
            }
            $filename = $this->getFilename($request);
            $request->place_image = $filename;
        }
        if ($request->place_image == null){
            $request->place_image = Place::findOrFail($place->id)->place_image;
        }
        $place->update([
            'place_name' => $request->place_name,
            'place_description' => $request->place_description,
            'place_image' => $filename,
            'address' => $request->address,
            'category' => $request->category,
            'user' => $current,
            'status' => $request->status ?? $place->status,
        ]);

        $place->address = $place->address()->get()[0];
        $place->category = $place->category()->get()[0];
        $place->user = $place->user()->get()[0];

        return response()->json([
            'status' => 'Mise à jour avec succèss',
            'data' => $place
        ]);
    }


    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Place  $place
     * @return \Illuminate\Http\Response
     */
    public function destroy(Place $place)
    {
        $place->delete();
        return response()->json([
            'status' => 'Supprimer avec succès'
        ]);
    }
    public function getFilename(Request $request): string
    {
        $filenameWithExt = $request->file('place_image')->getClientOriginalName();
        $filenameWithoutExt = pathinfo($filenameWithExt, PATHINFO_FILENAME);
        $extension = $request->file('place_image')->getClientOriginalExtension();
        $filename = $filenameWithoutExt . '_' . time() . '.' . $extension;
        $path = $request->file('place_image')->storeAs('public/uploads/places', $filename);
        return $filename;
    }
}
