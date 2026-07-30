<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\tag;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index(Request $request)
    {
        $request->validate([
            'scope' => 'nullable|in:place,ballade,both',
        ]);

        $query = DB::table('tags');
        if ($request->filled('scope')) {
            $query->whereIn('scope', [$request->scope, 'both']);
        }

        $tags = $query->get()->toArray();

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
            'scope' => 'nullable|in:place,ballade,both',
        ]);
        $tag = tag::create([
            'tag_name' => $request->tag_name,
            'color' => $request->color,
            'scope' => $request->scope ?? 'both',
        ]);

        return response()->json(['status' => 'Success', 'data' => $tag]);
    }

    /**
     * Display the specified resource.
     *
     * @return Response
     */
    public function show(tag $tag)
    {
        return response()->json($tag);
    }

    /**
     * Update the specified resource in storage.
     *
     * @return Response
     */
    public function update(Request $request, tag $tag)
    {
        $this->validate($request, [
            'tag_name' => 'required|max:50',
            'color' => 'required|max:10',
            'scope' => 'nullable|in:place,ballade,both',

        ]);
        $tag->update([
            'tag_name' => $request->tag_name,
            'color' => $request->color,
            'scope' => $request->scope ?? $tag->scope,
        ]);

        if ($tag->scope === 'ballade') {
            $tag->places()->detach();
        } elseif ($tag->scope === 'place') {
            $tag->ballades()->detach();
        }

        return response()->json(['status' => 'Success', 'data' => $tag]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return Response
     */
    public function destroy(tag $tag)
    {
        $tag->delete();

        return response()->json(['status' => 'Supprimer avec succès']);
    }
}
