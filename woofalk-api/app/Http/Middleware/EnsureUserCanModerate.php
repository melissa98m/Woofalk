<?php

namespace App\Http\Middleware;

use App\Support\Roles;
use Closure;
use Illuminate\Http\Request;

/**
 * Real server-side authorization check for moderation endpoints (place/
 * ballade/hebergement status changes, contact message replies) — the
 * narrower sibling of EnsureUserIsAdmin. Admins pass this too, since
 * ROLE_ADMIN is a superset of ROLE_MODERATOR's permissions.
 */
class EnsureUserCanModerate
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user || ! Roles::canModerate($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
