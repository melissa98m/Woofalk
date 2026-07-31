<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\CachesListing;
use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AddressController extends Controller
{
    use CachesListing;

    private const CACHE_KEY = 'addresses.index';

    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index()
    {
        $addresses = $this->rememberListing(self::CACHE_KEY, fn () => Address::all());

        return response()->json([
            'status' => 'Success',
            'data' => $addresses,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return Response
     */
    public function store(Request $request)
    {
        $request->validate([
            'address' => 'required|max:100',
            'postal_code' => 'required|max:6',
            'city' => 'required|max:100',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);
        // On crée une nouvelle adresse
        $address = Address::create([
            'address' => $request->address,
            'postal_code' => $request->postal_code,
            'city' => $request->city,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,

        ]);
        $this->forgetListing(self::CACHE_KEY);

        return response()->json([
            'status' => 'Success',
            'data' => $address,
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @return Response
     */
    public function show(Address $address)
    {
        return response()->json($address);
    }

    /**
     * Update the specified resource in storage.
     *
     * @return Response
     */
    public function update(Request $request, Address $address)
    {
        $this->validate($request, [
            'address' => 'required|max:100',
            'postal_code' => 'required|max:6',
            'city' => 'required|max:100',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);
        // On crée un nouvel utilisateur
        $address->update([
            'address' => $request->address,
            'postal_code' => $request->postal_code,
            'city' => $request->city,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);
        $this->forgetListing(self::CACHE_KEY);

        return response()->json([
            'status' => 'Success',
            'data' => $address,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return Response
     */
    public function destroy(Address $address)
    {
        $address->delete();
        $this->forgetListing(self::CACHE_KEY);

        // On retourne la réponse JSON
        return response()->json([
            'status' => 'Supprimer avec succès avec succèss',
        ]);
    }

    /**
     * Bulk-delete several addresses at once, used by the admin dashboard's
     * "select all / delete" toolbar.
     *
     * @return Response
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:addresses,id',
        ]);

        Address::whereIn('id', $validated['ids'])->delete();
        $this->forgetListing(self::CACHE_KEY);

        return response()->json(['status' => 'Supprimer avec succès']);
    }
}
