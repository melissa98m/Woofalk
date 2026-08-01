<?php

namespace App\Support;

use App\Models\User;

/**
 * Single source of truth for decoding the `roles` JSON column, shared by
 * EnsureUserIsAdmin/EnsureUserCanModerate (route-level gating) and
 * controllers that need a "self OR admin" check that middleware alone
 * can't express.
 */
class Roles
{
    public const ADMIN = 'ROLE_ADMIN';

    public const MODERATOR = 'ROLE_MODERATOR';

    public const USER = 'ROLE_USER';

    public static function isAdmin(User $user): bool
    {
        return in_array(self::ADMIN, self::of($user), true);
    }

    public static function isModerator(User $user): bool
    {
        return in_array(self::MODERATOR, self::of($user), true);
    }

    /**
     * Moderators only get the narrow set of permissions granted by the
     * `moderate` middleware (place/ballade/hebergement status changes,
     * replying to contact messages) — admins implicitly pass every check
     * a moderator does, so this is the union of the two.
     */
    public static function canModerate(User $user): bool
    {
        return self::isAdmin($user) || self::isModerator($user);
    }

    /**
     * Whether $user (null for a guest) may see a place/ballade/hebergement
     * that isn't published yet: its owner, or anyone who can moderate.
     * Used by the public index/show endpoints to hide "en_attente" records
     * from everyone else while still letting the admin dashboard (which
     * reads the same endpoints) and the owner's own pages see them.
     */
    public static function canViewPending(?User $user, ?int $ownerId): bool
    {
        if (! $user) {
            return false;
        }

        return $user->id === $ownerId || self::canModerate($user);
    }

    private static function of(User $user): array
    {
        return json_decode($user->roles ?? '[]', true) ?: [];
    }
}
