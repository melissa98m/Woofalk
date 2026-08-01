<?php

namespace Tests\Feature;

use App\Models\Ballade;
use App\Models\Hebergement;
use App\Models\Place;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use DatabaseTransactions;

    private function place(): Place
    {
        return Place::factory()->create(['status' => 'publie']);
    }

    public function test_user_can_report_a_place(): void
    {
        $user = User::factory()->create();
        $place = $this->place();

        $response = $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/report", [
            'subject' => Report::SUBJECT_INAPPROPRIATE,
        ]);

        $response->assertStatus(200);
        $response->assertJson(['is_reported' => true, 'reports_count' => 1]);
        $this->assertDatabaseHas('reports', [
            'reportable_type' => Place::class,
            'reportable_id' => $place->id,
            'user_id' => $user->id,
            'subject' => Report::SUBJECT_INAPPROPRIATE,
        ]);
    }

    public function test_report_requires_a_valid_subject(): void
    {
        $user = User::factory()->create();
        $place = $this->place();

        $missing = $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/report", []);
        $missing->assertStatus(422);

        $invalid = $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/report", [
            'subject' => 'Pas un vrai motif',
        ]);
        $invalid->assertStatus(422);
    }

    public function test_report_with_subject_autre_requires_a_message(): void
    {
        $user = User::factory()->create();
        $place = $this->place();

        $withoutMessage = $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/report", [
            'subject' => Report::SUBJECT_OTHER,
        ]);
        $withoutMessage->assertStatus(422);

        $withMessage = $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/report", [
            'subject' => Report::SUBJECT_OTHER,
            'message' => 'Le lieu a déménagé de quelques rues.',
        ]);
        $withMessage->assertStatus(200);
    }

    public function test_user_cannot_report_the_same_place_twice(): void
    {
        $user = User::factory()->create();
        $place = $this->place();

        $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_DUPLICATE]);
        $response = $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_DUPLICATE]);

        $response->assertStatus(409);
        $this->assertSame(1, Report::where('reportable_type', Place::class)->where('reportable_id', $place->id)->count());
    }

    public function test_guest_cannot_report_a_place(): void
    {
        $place = $this->place();

        $response = $this->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_DUPLICATE]);

        $response->assertStatus(401);
    }

    public function test_reporting_a_place_five_times_sets_status_en_attente(): void
    {
        $place = $this->place();

        foreach (range(1, 5) as $i) {
            $reporter = User::factory()->create();
            $this->actingAs($reporter, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_INAPPROPRIATE]);
        }

        $this->assertSame('en_attente', $place->fresh()->status);
    }

    public function test_reporting_a_place_four_times_does_not_change_status(): void
    {
        $place = $this->place();

        foreach (range(1, 4) as $i) {
            $reporter = User::factory()->create();
            $this->actingAs($reporter, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_INAPPROPRIATE]);
        }

        $this->assertSame('publie', $place->fresh()->status);
    }

    public function test_user_can_report_a_ballade_and_a_hebergement(): void
    {
        $user = User::factory()->create();
        $ballade = Ballade::factory()->create(['status' => 'publie']);
        $hebergement = Hebergement::factory()->create(['status' => 'publie']);

        $balladeResponse = $this->actingAs($user, 'api')->postJson("/api/ballades/{$ballade->id}/report", ['subject' => Report::SUBJECT_CLOSED]);
        $balladeResponse->assertStatus(200);
        $this->assertDatabaseHas('reports', ['reportable_type' => Ballade::class, 'reportable_id' => $ballade->id]);

        $hebergementResponse = $this->actingAs($user, 'api')->postJson("/api/hebergements/{$hebergement->id}/report", ['subject' => Report::SUBJECT_CLOSED]);
        $hebergementResponse->assertStatus(200);
        $this->assertDatabaseHas('reports', ['reportable_type' => Hebergement::class, 'reportable_id' => $hebergement->id]);
    }

    public function test_show_endpoint_reports_is_reported_for_authenticated_user(): void
    {
        $reporter = User::factory()->create();
        $otherUser = User::factory()->create();
        $place = $this->place();
        $this->actingAs($reporter, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_INAPPROPRIATE]);

        $asReporter = $this->actingAs($reporter, 'api')->getJson("/api/places/{$place->id}");
        $asReporter->assertJson(['is_reported' => true]);

        $asOtherUser = $this->actingAs($otherUser, 'api')->getJson("/api/places/{$place->id}");
        $asOtherUser->assertJson(['is_reported' => false]);
    }

    public function test_moderator_can_list_all_reports(): void
    {
        $moderator = User::factory()->moderator()->create();
        $reporter = User::factory()->create();
        $place = $this->place();
        $ballade = Ballade::factory()->create(['status' => 'publie']);
        $this->actingAs($reporter, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_INAPPROPRIATE]);
        $this->actingAs($reporter, 'api')->postJson("/api/ballades/{$ballade->id}/report", ['subject' => Report::SUBJECT_CLOSED]);

        $response = $this->actingAs($moderator, 'api')->getJson('/api/reports');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
        $response->assertJsonFragment(['reportable_type_slug' => 'places']);
        $response->assertJsonFragment(['reportable_type_slug' => 'ballades']);
    }

    public function test_regular_user_cannot_list_reports(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson('/api/reports');

        $response->assertStatus(403);
    }

    public function test_guest_cannot_list_reports(): void
    {
        $response = $this->getJson('/api/reports');

        $response->assertStatus(401);
    }

    public function test_moderator_can_dismiss_a_report(): void
    {
        $moderator = User::factory()->moderator()->create();
        $reporter = User::factory()->create();
        $place = $this->place();
        $this->actingAs($reporter, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_INAPPROPRIATE]);
        $report = Report::first();

        $response = $this->actingAs($moderator, 'api')->patchJson("/api/reports/{$report->id}/dismiss");

        $response->assertStatus(200);
        $this->assertNotNull($report->fresh()->resolved_at);
    }

    public function test_regular_user_cannot_dismiss_a_report(): void
    {
        $user = User::factory()->create();
        $reporter = User::factory()->create();
        $place = $this->place();
        $this->actingAs($reporter, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_INAPPROPRIATE]);
        $report = Report::first();

        $response = $this->actingAs($user, 'api')->patchJson("/api/reports/{$report->id}/dismiss");

        $response->assertStatus(403);
    }

    public function test_dismissed_reports_do_not_count_towards_the_threshold(): void
    {
        $moderator = User::factory()->moderator()->create();
        $place = $this->place();

        foreach (range(1, 5) as $i) {
            $reporter = User::factory()->create();
            $this->actingAs($reporter, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_INAPPROPRIATE]);
        }
        $this->assertSame('en_attente', $place->fresh()->status);

        Report::where('reportable_type', Place::class)->where('reportable_id', $place->id)->get()->each(
            fn (Report $report) => $this->actingAs($moderator, 'api')->patchJson("/api/reports/{$report->id}/dismiss")
        );
        $this->actingAs($moderator, 'api')->patchJson('/api/places/bulk-status', ['ids' => [$place->id], 'status' => 'publie']);
        $this->assertSame('publie', $place->fresh()->status);

        $freshReporter = User::factory()->create();
        $this->actingAs($freshReporter, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_INAPPROPRIATE]);

        $this->assertSame('publie', $place->fresh()->status);
    }

    public function test_deleting_a_place_removes_its_reports(): void
    {
        $reporter = User::factory()->create();
        $place = $this->place();
        $this->actingAs($reporter, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_INAPPROPRIATE]);

        $place->delete();

        $this->assertDatabaseMissing('reports', ['reportable_type' => Place::class, 'reportable_id' => $place->id]);
    }

    public function test_bulk_destroy_places_also_deletes_their_reports(): void
    {
        $admin = User::factory()->admin()->create();
        $reporter = User::factory()->create();
        $place = $this->place();
        $this->actingAs($reporter, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_INAPPROPRIATE]);

        $this->actingAs($admin, 'api')->deleteJson('/api/places/bulk', ['ids' => [$place->id]]);

        $this->assertDatabaseMissing('reports', ['reportable_type' => Place::class, 'reportable_id' => $place->id]);
    }

    public function test_deleting_a_user_removes_their_reports(): void
    {
        $reporter = User::factory()->create();
        $place = $this->place();
        $this->actingAs($reporter, 'api')->postJson("/api/places/{$place->id}/report", ['subject' => Report::SUBJECT_INAPPROPRIATE]);

        $reporter->delete();

        $this->assertDatabaseMissing('reports', ['reportable_type' => Place::class, 'reportable_id' => $place->id]);
    }
}
