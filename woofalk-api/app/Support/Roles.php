<?php

namespace App\Support;

use App\Models\User;

/**
 * Single source of truth for decoding the `roles` JSON column, shared by
 * EnsureUserIsAdmin (route-level gating) and controllers that need a
 * "self OR admin" check that middleware alone can't express.
 */
class Roles
{
    public static function isAdmin(User $user): bool
    {
        $roles = json_decode($user->roles ?? '[]', true) ?: [];

        return in_array('ROLE_ADMIN', $roles, true);
    }
}
