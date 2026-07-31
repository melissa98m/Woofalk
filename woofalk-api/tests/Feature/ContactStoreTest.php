<?php

namespace Tests\Feature;

use App\Mail\Contact as MailContact;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactStoreTest extends TestCase
{
    use DatabaseTransactions;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Zoé',
            'email' => 'zoe@example.com',
            'subject' => 'Autre',
            'contenu' => 'Bonjour, ceci est un message de test.',
        ], $overrides);
    }

    public function test_guest_can_submit_the_contact_form(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/contact', $this->payload());

        $response->assertStatus(200);
        $this->assertDatabaseHas('contacts', ['email' => 'zoe@example.com', 'subject' => 'Autre']);
        Mail::assertSent(MailContact::class);
    }

    public function test_contact_form_requires_mandatory_fields(): void
    {
        $response = $this->postJson('/api/contact', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'email', 'subject', 'contenu']);
    }

    public function test_honeypot_field_silently_discards_the_submission(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/contact', $this->payload(['website' => 'https://spambot.example']));

        $response->assertStatus(200);
        $this->assertDatabaseMissing('contacts', ['email' => 'zoe@example.com']);
        Mail::assertNothingSent();
    }
}
