<?php

namespace Tests\Feature;

use App\Mail\ContactReply;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactFTest extends TestCase
{
    use DatabaseTransactions;

    public function test_guest_cannot_list_contact_messages(): void
    {
        $response = $this->getJson('/api/contacts');

        $response->assertStatus(401);
    }

    public function test_regular_user_cannot_list_contact_messages(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson('/api/contacts');

        $response->assertStatus(403);
    }

    public function test_admin_can_list_contact_messages_with_reports_first(): void
    {
        $admin = User::factory()->admin()->create();
        Contact::create(['name' => 'Zoé', 'email' => 'zoe-fttest@example.com', 'subject' => 'Autre', 'contenu' => 'Coucou']);
        Contact::create(['name' => 'Ana', 'email' => 'ana-fttest@example.com', 'subject' => Contact::REPORT_SUBJECT, 'contenu' => 'Lieu fermé']);
        Contact::create(['name' => 'Bo', 'email' => 'bo-fttest@example.com', 'subject' => 'Proposer une balade', 'contenu' => 'Nouvelle balade']);

        $response = $this->actingAs($admin, 'api')->getJson('/api/contacts');

        $response->assertStatus(200);
        $data = $response->json('data');

        // Every report row must be ordered before every non-report row.
        $reportFlags = array_column($data, 'is_report');
        $firstNonReport = array_search(false, $reportFlags, true);
        $lastReport = array_search(true, array_reverse($reportFlags, true), true);
        $this->assertNotFalse($firstNonReport);
        $this->assertLessThan($firstNonReport, $lastReport);

        $byEmail = collect($data)->keyBy('email');
        $this->assertTrue($byEmail['ana-fttest@example.com']['is_report']);
        $this->assertFalse($byEmail['zoe-fttest@example.com']['is_report']);
        $this->assertFalse($byEmail['bo-fttest@example.com']['is_report']);
    }

    public function test_guest_cannot_reply_to_a_contact_message(): void
    {
        $contact = Contact::create(['name' => 'Zoé', 'email' => 'zoe-reply@example.com', 'subject' => 'Autre', 'contenu' => 'Coucou']);

        $response = $this->postJson("/api/contacts/{$contact->id}/reply", ['message' => 'Bonjour']);

        $response->assertStatus(401);
    }

    public function test_regular_user_cannot_reply_to_a_contact_message(): void
    {
        $user = User::factory()->create();
        $contact = Contact::create(['name' => 'Zoé', 'email' => 'zoe-reply2@example.com', 'subject' => 'Autre', 'contenu' => 'Coucou']);

        $response = $this->actingAs($user, 'api')->postJson("/api/contacts/{$contact->id}/reply", ['message' => 'Bonjour']);

        $response->assertStatus(403);
    }

    public function test_reply_requires_a_message(): void
    {
        $admin = User::factory()->admin()->create();
        $contact = Contact::create(['name' => 'Zoé', 'email' => 'zoe-reply3@example.com', 'subject' => 'Autre', 'contenu' => 'Coucou']);

        $response = $this->actingAs($admin, 'api')->postJson("/api/contacts/{$contact->id}/reply", []);

        $response->assertStatus(422);
    }

    public function test_admin_can_reply_to_a_contact_message(): void
    {
        Mail::fake();
        $admin = User::factory()->admin()->create();
        $contact = Contact::create(['name' => 'Zoé', 'email' => 'zoe-reply4@example.com', 'subject' => 'Autre', 'contenu' => 'Coucou']);

        $response = $this->actingAs($admin, 'api')->postJson("/api/contacts/{$contact->id}/reply", [
            'message' => 'Merci pour votre message, voici notre réponse.',
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($response->json('data.replied_at'));
        $this->assertNotNull($contact->fresh()->replied_at);
        Mail::assertSent(ContactReply::class, fn ($mail) => $mail->hasTo($contact->email));
    }
}
