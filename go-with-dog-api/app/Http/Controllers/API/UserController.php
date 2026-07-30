<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Ballade;
use App\Models\Place;
use App\Models\User;
use App\Support\Roles;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     */
    public function index()
    {
        $users = User::all();

        return response()->json([
            'status' => 'Success',
            'data' => $users,
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @return JsonResponse
     */
    public function show(Request $request, User $user)
    {
        if (! $this->canActOn($request, $user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($user);
    }

    /**
     * Remove the specified resource from storage.
     *
     * On account deletion the user's own data (profile, likes) is fully
     * erased, but places/ballades they authored are anonymized rather than
     * deleted: the content stays public (its value to other users), only
     * detached from the now-deleted account (GDPR right to erasure covers
     * the user's personal data, not independently-created public content).
     *
     * @return Response
     */
    public function destroy(Request $request, User $user)
    {
        if (! $this->canActOn($request, $user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user->places()->update(['user' => null]);
        $user->ballades()->update(['user' => null]);
        $user->delete();

        return response()->json(['status' => 'Supprimer avec succès']);
    }

    /**
     * Bulk-delete several users at once, used by the admin dashboard's
     * "select all / delete" toolbar. The authenticated admin's own account
     * is silently excluded so an admin can never accidentally delete
     * themselves via a broad selection.
     *
     * @return JsonResponse
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:users,id',
        ]);

        $ids = array_values(array_diff($validated['ids'], [$request->user()->id]));

        if (empty($ids)) {
            return response()->json(['status' => 'Aucun utilisateur à supprimer'], 422);
        }

        Place::whereIn('user', $ids)->update(['user' => null]);
        Ballade::whereIn('user', $ids)->update(['user' => null]);
        User::whereIn('id', $ids)->delete();

        return response()->json(['status' => 'Supprimer avec succès']);
    }

    /**
     * Export the authenticated user's own personal data (GDPR right to
     * data portability) as a downloadable JSON file.
     *
     * @return JsonResponse
     */
    public function exportMyData(Request $request)
    {
        $user = $request->user();

        $payload = [
            'account' => $user->only(['id', 'username', 'email', 'email_verified_at', 'created_at', 'terms_accepted_at']),
            'places_created' => $user->places()->get(['id', 'place_name', 'place_description', 'status', 'created_at']),
            'ballades_created' => $user->ballades()->get(['id', 'ballade_name', 'ballade_description', 'status', 'created_at']),
            'liked_places' => $user->likedPlaces()->get(['places.id', 'places.place_name']),
            'liked_ballades' => $user->likedBallades()->get(['ballades.id', 'ballades.ballade_name']),
        ];

        $filename = 'mes-donnees-gowithdog-'.now()->format('Ymd-His').'.json';

        return response()->json($payload, 200, [
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Whether the authenticated request is allowed to view/modify $user:
     * either the account owner acting on themselves, or an admin.
     */
    private function canActOn(Request $request, User $user): bool
    {
        $current = $request->user();

        return $current->id === $user->id || Roles::isAdmin($current);
    }

    public function Current()
    {
        $current = Auth::id();

        return response()->json(
            ['status' => 'Success',
                'data' => $current,
            ]);
    }

    public function updatePassword(Request $request)
    {
        // Validation
        $request->validate(
            [
                'old_password' => 'required',
                'new_password' => 'required|min:6',
                'confirm_password' => 'required|same:new_password',
            ]);

        // Match The Old Password
        $user = $request->user();
        if (Hash::check($request->old_password, auth()->user()->password)) {
            $user->update([
                'password' => Hash::make($request->new_password),
            ]);

            return response()->json([
                'message' => 'Password successfully updated',
            ], 200);
        } else {
            return response()->json([
                'message' => 'Old password does not matched',
            ], 400);
        }

    }
}
