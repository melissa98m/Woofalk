<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use DatabaseTransactions;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'username' => 'chiendetest',
            'email' => 'chien@example.com',
            'password' => 'password123',
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
}
