<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index(Request $request)
    {
        $request->validate([
            'scope' => 'nullable|in:place,hebergement,both',
        ]);

        $query = DB::table('categories');
        if ($request->filled('scope')) {
            $query->whereIn('scope', [$request->scope, 'both']);
        }

        $categories = $query->get()->toArray();

        return response()->json(['status' => 'Success', 'data' => $categories]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return Response
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_name' => 'required|max:50',
            'scope' => 'nullable|in:place,hebergement,both',
        ]);
        $category = Category::create([
            'category_name' => $request->category_name,
            'scope' => $request->scope ?? 'place',
        ]);

        return response()->json(['status' => 'Success', 'data' => $category]);
    }

    /**
     * Display the specified resource.
     *
     * @return Response
     */
    public function show(Category $category)
    {
        return response()->json($category);
    }

    /**
     * Update the specified resource in storage.
     *
     * @return Response
     */
    public function update(Request $request, Category $category)
    {
        $this->validate($request, [
            'category_name' => 'required|max:50',
            'scope' => 'nullable|in:place,hebergement,both',
        ]);
        // Unlike tags.scope (a many-to-many pivot, safe to detach), category
        // is a required single FK on places/hebergements — narrowing scope
        // deliberately does NOT touch existing rows still pointing at this
        // category, since nulling a NOT NULL column would break them.
        $category->update([
            'category_name' => $request->category_name,
            'scope' => $request->scope ?? $category->scope,
        ]);

        return response()->json(['status' => 'Success', 'data' => $category]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return Response
     */
    public function destroy(Category $category)
    {
        $category->delete();

        return response()->json(['status' => 'Supprimer avec succès']);
    }

    /**
     * Bulk-delete several categories at once, used by the admin dashboard's
     * "select all / delete" toolbar.
     *
     * @return Response
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:categories,id',
        ]);

        Category::whereIn('id', $validated['ids'])->delete();

        return response()->json(['status' => 'Supprimer avec succès']);
    }
}
