<?php

namespace App\Http\Middleware;

use App\Support\Roles;
use Closure;
use Illuminate\Http\Request;

/**
 * Real server-side authorization check for admin-only endpoints.
 *
 * The front-end derives admin UI state from the `roles` claim it decodes out
 * of the JWT client-side (see woofalk-app/src/services/auth/token.jsx),
 * but that is only a UI convenience — it must never be trusted to protect
 * data. This middleware re-checks the authenticated user's `roles` column
 * from the database on every request.
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user || ! Roles::isAdmin($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
