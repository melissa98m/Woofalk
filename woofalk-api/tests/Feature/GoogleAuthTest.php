<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Auth\GoogleTokenVerifierContract;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use RuntimeException;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use DatabaseTransactions;

    private function fakeVerifier(array $payload): GoogleTokenVerifierContract
    {
        return new class($payload) implements GoogleTokenVerifierContract
        {
            public function __construct(private array $payload) {}

            public function verify(string $idToken): array
            {
                return $this->payload;
            }
        };
    }

    private function failingVerifier(): GoogleTokenVerifierContract
    {
        return new class implements GoogleTokenVerifierContract
        {
            public function verify(string $idToken): array
            {
                throw new RuntimeException('invalid token');
            }
        };
    }

    private function googlePayload(array $overrides = []): array
    {
        return array_merge([
            'sub' => 'google-sub-123',
            'email' => 'chien@example.com',
            'email_verified' => true,
            'name' => 'Chien De Test',
        ], $overrides);
    }

    private function authCookieName(): string
    {
        return config('jwt.cookie_key_name', 'access_token');
    }

    private function assertAuthCookieSet($response): void
    {
        $cookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === $this->authCookieName());

        $this->assertNotNull($cookie, 'Expected the auth cookie to be set.');
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertNotEmpty($cookie->getValue());
    }

    public function test_creates_a_new_user_on_first_google_login(): void
    {
        $this->app->instance(GoogleTokenVerifierContract::class, $this->fakeVerifier($this->googlePayload()));

        $response = $this->postJson('/api/auth/google', [
            'credential' => 'fake-credential',
            'accept_terms' => '1',
        ]);

        $response->assertStatus(200);
        $response->assertJsonMissingPath('token');
        $this->assertAuthCookieSet($response);

        $user = User::where('email', 'chien@example.com')->firstOrFail();
        $this->assertSame('google-sub-123', $user->google_id);
        $this->assertNull($user->password);
        $this->assertNotNull($user->terms_accepted_at);
        $this->assertSame(['ROLE_USER'], json_decode($user->roles, true));
    }

    public function test_links_google_id_to_an_existing_account_matched_by_email(): void
    {
        $user = User::factory()->create(['email' => 'chien@example.com', 'google_id' => null]);
        $originalTermsAcceptedAt = $user->terms_accepted_at;

        $this->app->instance(GoogleTokenVerifierContract::class, $this->fakeVerifier($this->googlePayload()));

        $response = $this->postJson('/api/auth/google', [
            'credential' => 'fake-credential',
            'accept_terms' => '1',
        ]);

        $response->assertStatus(200);
        $this->assertAuthCookieSet($response);

        $this->assertSame(1, User::where('email', 'chien@example.com')->count());
        $user->refresh();
        $this->assertSame('google-sub-123', $user->google_id);
        $this->assertEquals($originalTermsAcceptedAt, $user->terms_accepted_at);
    }

    public function test_logs_in_an_existing_user_already_linked_by_google_id(): void
    {
        $user = User::factory()->create(['email' => 'chien@example.com', 'google_id' => 'google-sub-123']);

        $this->app->instance(GoogleTokenVerifierContract::class, $this->fakeVerifier($this->googlePayload()));

        $response = $this->postJson('/api/auth/google', [
            'credential' => 'fake-credential',
            'accept_terms' => '1',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['user' => ['id' => $user->id]]);
        $this->assertSame(1, User::where('google_id', 'google-sub-123')->count());
    }

    public function test_rejects_an_unverified_google_email(): void
    {
        $this->app->instance(
            GoogleTokenVerifierContract::class,
            $this->fakeVerifier($this->googlePayload(['email_verified' => false]))
        );

        $response = $this->postJson('/api/auth/google', [
            'credential' => 'fake-credential',
            'accept_terms' => '1',
        ]);

        $response->assertStatus(401);
        $this->assertDatabaseMissing('users', ['email' => 'chien@example.com']);
    }

    public function test_rejects_an_invalid_google_token(): void
    {
        $this->app->instance(GoogleTokenVerifierContract::class, $this->failingVerifier());

        $response = $this->postJson('/api/auth/google', [
            'credential' => 'not-a-real-token',
            'accept_terms' => '1',
        ]);

        $response->assertStatus(401);
    }

    public function test_requires_accepting_terms(): void
    {
        $this->app->instance(GoogleTokenVerifierContract::class, $this->fakeVerifier($this->googlePayload()));

        $response = $this->postJson('/api/auth/google', [
            'credential' => 'fake-credential',
            'accept_terms' => null,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('accept_terms');
    }
}
