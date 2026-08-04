<?php

namespace Tests\Feature;

use App\Mail\ResetPasswordEmail;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use DatabaseTransactions;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'username' => 'chiendetest',
            'email' => 'chien@example.com',
            'password' => 'Password123',
            'accept_terms' => '1',
        ], $overrides);
    }

    public function test_register_requires_accepting_terms(): void
    {
        $response = $this->postJson('/api/register', $this->payload(['accept_terms' => null]));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('accept_terms');
    }

    public function test_register_succeeds_with_accepted_terms(): void
    {
        $response = $this->postJson('/api/register', $this->payload());

        $response->assertStatus(200);
        $user = User::where('email', 'chien@example.com')->firstOrFail();
        $this->assertNotNull($user->terms_accepted_at);
    }

    public function test_register_response_does_not_echo_submitted_request(): void
    {
        $response = $this->postJson('/api/register', $this->payload(['password' => 'SuperSecret123']));

        $response->assertStatus(200);
        $response->assertJsonMissingPath('request');
        $this->assertStringNotContainsString('SuperSecret123', $response->getContent());
    }

    private function authCookieName(): string
    {
        return config('jwt.cookie_key_name', 'access_token');
    }

    public function test_login_issues_httponly_cookie_without_exposing_token_in_body(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonMissingPath('token');
        $response->assertJsonStructure(['status', 'user', 'expires_at']);

        $cookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === $this->authCookieName());

        $this->assertNotNull($cookie, 'Expected the auth cookie to be set on login.');
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertNotEmpty($cookie->getValue());
    }

    public function test_register_does_not_log_the_user_in(): void
    {
        $response = $this->postJson('/api/register', $this->payload());

        $response->assertStatus(200);
        $response->assertJsonMissingPath('token');
        $response->assertJsonMissingPath('authorisation');

        $cookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === $this->authCookieName());

        $this->assertNull($cookie, 'Registration should not start a session.');
    }

    public function test_logout_clears_the_auth_cookie(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->postJson('/api/logout');

        $response->assertStatus(200);

        $cookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === $this->authCookieName());

        $this->assertNotNull($cookie, 'Expected logout to send an expired auth cookie.');
        $this->assertLessThan(time(), $cookie->getExpiresTime());
    }

    public function test_login_rejects_wrong_password(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
    }

    public function test_forgot_password_sends_a_reset_email_for_a_known_address(): void
    {
        Mail::fake();
        $user = User::factory()->create();

        $response = $this->postJson('/api/forgot-password', ['email' => $user->email]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('password_resets', ['email' => $user->email]);
        Mail::assertSent(ResetPasswordEmail::class);
    }

    public function test_forgot_password_returns_the_same_response_for_an_unknown_email(): void
    {
        // Must not reveal whether the address is registered — a 422 for
        // "unknown email" vs 200 for "known email" would make this an
        // account-enumeration oracle.
        Mail::fake();

        $response = $this->postJson('/api/forgot-password', ['email' => 'nobody@example.com']);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('password_resets', ['email' => 'nobody@example.com']);
        Mail::assertNotSent(ResetPasswordEmail::class);
    }

    public function test_reset_password_succeeds_with_a_valid_token(): void
    {
        $user = User::factory()->create();
        $token = Str::random(60);
        DB::table('password_resets')->insert([
            'email' => $user->email,
            // Tokens are stored hashed in production (see AuthController::forgotPassword) —
            // match that here so this test exercises the real Hash::check comparison.
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'password' => 'NewPassword123',
            'token' => $token,
        ]);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('NewPassword123', $user->fresh()->password));
        $this->assertDatabaseMissing('password_resets', ['email' => $user->email]);
    }

    public function test_reset_password_rejects_an_invalid_token(): void
    {
        $user = User::factory()->create();
        DB::table('password_resets')->insert([
            'email' => $user->email,
            'token' => Str::random(60),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'password' => 'NewPassword123',
            'token' => 'not-the-right-token',
        ]);

        $response->assertStatus(422);
        $this->assertFalse(Hash::check('NewPassword123', $user->fresh()->password));
    }

    public function test_reset_password_rejects_an_expired_token(): void
    {
        $user = User::factory()->create();
        $token = Str::random(60);
        DB::table('password_resets')->insert([
            'email' => $user->email,
            'token' => $token,
            'created_at' => now()->subMinutes(61),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'password' => 'NewPassword123',
            'token' => $token,
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('password_resets', ['email' => $user->email]);
    }

    public function test_refresh_issues_a_new_cookie(): void
    {
        // actingAs() sets the guard's user directly without a real encoded
        // token, but Auth::refresh() needs an actual JWT to decode/reissue —
        // so this has to go through a real login first, cookie and all.
        $user = User::factory()->create();
        $loginResponse = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password']);
        $cookieName = $this->authCookieName();
        $initialToken = collect($loginResponse->headers->getCookies())
            ->first(fn ($c) => $c->getName() === $cookieName)
            ->getValue();

        $response = $this->withCookie($cookieName, $initialToken)->postJson('/api/refresh');

        $response->assertStatus(200);
        $response->assertJsonMissingPath('token');

        $cookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === $cookieName);
        $this->assertNotNull($cookie);
        $this->assertNotEmpty($cookie->getValue());
        $this->assertNotSame($initialToken, $cookie->getValue());
    }

    public function test_current_user_returns_authenticated_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson('/api/current-user');

        $response->assertStatus(200);
        $response->assertJson(['id' => $user->id]);
    }
}
