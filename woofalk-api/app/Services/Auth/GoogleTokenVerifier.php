<?php

namespace App\Services\Auth;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GoogleTokenVerifier implements GoogleTokenVerifierContract
{
    private const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

    private const ALLOWED_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

    public function verify(string $idToken): array
    {
        $keySet = JWK::parseKeySet($this->fetchGoogleCerts());

        // JWT::decode validates the signature and the exp/nbf/iat claims;
        // aud/iss still need an explicit check since Google issues tokens
        // for many different client IDs and this app must only accept its own.
        $payload = JWT::decode($idToken, $keySet);

        $clientId = config('services.google.client_id');

        if (empty($clientId) || ($payload->aud ?? null) !== $clientId) {
            throw new RuntimeException('Google ID token audience mismatch.');
        }

        if (! in_array($payload->iss ?? null, self::ALLOWED_ISSUERS, true)) {
            throw new RuntimeException('Google ID token issuer mismatch.');
        }

        if (empty($payload->sub) || empty($payload->email)) {
            throw new RuntimeException('Google ID token is missing required claims.');
        }

        return [
            'sub' => $payload->sub,
            'email' => $payload->email,
            'email_verified' => (bool) ($payload->email_verified ?? false),
            'name' => $payload->name ?? null,
        ];
    }

    private function fetchGoogleCerts(): array
    {
        return Cache::remember('google_oauth_certs', now()->addHours(6), function () {
            return Http::get(self::CERTS_URL)->throw()->json();
        });
    }
}
