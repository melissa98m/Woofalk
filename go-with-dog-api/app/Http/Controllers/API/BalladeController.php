<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Ballade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class BalladeController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $ballades = Ballade::with(['user', 'tags'])->get();
        return response()->json([
            'status' => 'Success',
            'data' => $ballades
        ]);
    }

    public function byUser()
    {
        $userId = Auth::id();
        $ballades = Ballade::with(['user', 'tags'])
            ->where('user', '=', $userId)
            ->get();
        return response()->json([
            'status' => 'Success',
            'data' => $ballades,
        ]);
    }
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function sortByDateDesc()
    {
        $balladesdesc = Ballade::with(['user', 'tags'])
            ->orderBy("created_at", 'desc')
            ->get();
        return response()->json([
            'status' => 'Success',
            'data' => $balladesdesc
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
        $current = Auth::id();
        $request->validate([
            'ballade_name' => 'required|max:200',
            'ballade_description' => 'required',
            'distance' => 'required',
            'denivele' => 'required',
            'ballade_image' => 'nullable|mimes:png,jpg,jpeg|max:2048',
            'ballade_latitude'=> 'required|numeric|between:-90,90',
            'ballade_longitude'=> 'required|numeric|between:-180,180',
            'status' => 'nullable|in:publie,en_attente',
            'tags' => 'nullable|array',
            'tags.*' => 'integer|exists:tags,id',
        ]);
        if ($request->hasFile('ballade_image')) {
            $filename = $this->getFilename($request);
        } else {
            $filename = Null;
        }
        $ballade = Ballade::create([
            'ballade_name' => $request->ballade_name,
            'ballade_description' => $request->ballade_description,
            'distance' => $request->distance,
            'denivele' => $request->denivele,
            'ballade_image' => $filename,
            'ballade_latitude' => $request->ballade_latitude,
            'ballade_longitude' => $request->ballade_longitude,
            'user' => $current,
            'status' => $request->status ?? 'publie',
        ]);
        $ballade->tags()->sync($request->input('tags', []));

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
     * @param  \App\Models\Ballade  $ballade
     * @return \Illuminate\Http\Response
     */
    public function show(Ballade $ballade)
    {
        $ballade->load(['user']);
        $ballade->load(['tags']);
        return response()->json($ballade);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Ballade  $ballade
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Ballade $ballade)
    {
        $current = Auth::id();
        $this->validate($request, [
            'ballade_name' => 'required|max:200',
            'ballade_description' => 'required',
            'distance' => 'required',
            'denivele' => 'required',
            'ballade_image' => 'nullable|mimes:png,jpg,jpeg|max:2048',
            'ballade_latitude'=> 'required|numeric|between:-90,90',
            'ballade_longitude'=> 'required|numeric|between:-180,180',
            'status' => 'nullable|in:publie,en_attente',
            'tags' => 'nullable|array',
            'tags.*' => 'integer|exists:tags,id',
        ]);

        if ($request->hasFile('ballade_image')) {
            if (Ballade::findOrFail($ballade->id)->ballade_image){
                Storage::delete("/public/uploads/ballade/".Ballade::findOrFail($ballade->id)->ballade_image);
            }
            $filename = $this->getFilename($request);
            $request->ballade_image = $filename;
        }

        if ($request->ballade_image == null){
            $request->ballade_image = Ballade::findOrFail($ballade->id)->ballade_image;
        }

        $ballade->update([
            'ballade_name' => $request->ballade_name,
            'ballade_description' => $request->ballade_description,
            'distance' => $request->distance,
            'denivele' => $request->denivele,
            'ballade_image' => $filename,
            'ballade_latitude' => $request->ballade_latitude,
            'ballade_longitude' => $request->ballade_longitude,
            'user' => $current,
            'status' => $request->status ?? $ballade->status,
        ]);
        $ballade->tags()->sync($request->input('tags', []));

        $ballade->tags = $ballade->tags()->get();
        $ballade->user = $ballade->user()->get()[0];

        return response()->json([
            'status' => 'Mise à jour avec success',
            'data' => $ballade,
            'request' => $request->ballade_image
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Ballade  $ballade
     * @return \Illuminate\Http\Response
     */
    public function destroy(Ballade $ballade)
    {
        if ($ballade->ballade_image){
            Storage::delete("/public/uploads/ballades".$ballade->ballade_image);
        }
        $ballade->delete();
        return response()->json([
            'status' => 'Supprimer avec success'
        ]);
    }

    public function getFilename(Request $request): string
    {
        $filenameWithExt = $request->file('ballade_image')->getClientOriginalName();
        $filenameWithoutExt = pathinfo($filenameWithExt, PATHINFO_FILENAME);
        $extension = $request->file('ballade_image')->getClientOriginalExtension();
        $filename = $filenameWithoutExt . '_' . time() . '.' . $extension;
        $path = $request->file('ballade_image')->storeAs('public/uploads/ballades', $filename);
        return $filename;
    }
}
