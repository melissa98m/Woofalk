<?php

namespace App\Services\Auth;

interface GoogleTokenVerifierContract
{
    /**
     * Verify a Google Identity Services ID token and return its claims.
     *
     * Must throw when the token's signature, issuer, audience, or expiry
     * is invalid — callers treat any exception as an authentication failure.
     *
     * @return array{sub: string, email: string, email_verified: bool, name: ?string}
     */
    public function verify(string $idToken): array;
}
