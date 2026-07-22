<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $addresses = Address::all();
        return response()->json([
            'status' => 'Success',
            'data' => $addresses
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
        return response()->json([
            'status' => 'Success',
            'data' => $address,
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Address  $address
     * @return \Illuminate\Http\Response
     */
    public function show(Address $address)
    {
        return response()->json($address);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Address  $address
     * @return \Illuminate\Http\Response
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
        return response()->json([
            'status' => 'Success',
            'data' => $address
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Address  $address
     * @return \Illuminate\Http\Response
     */
    public function destroy(Address $address)
    {
        $address->delete();
        // On retourne la réponse JSON
        return response()->json([
            'status' => 'Supprimer avec succès avec succèss'
        ]);
    }
}
