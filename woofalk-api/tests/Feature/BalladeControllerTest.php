<?php

namespace Tests\Feature;

use App\Models\Ballade;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class BalladeControllerTest extends TestCase
{
    use DatabaseTransactions;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'ballade_name' => 'Balade du chien',
            'ballade_description' => 'lorem ipsum',
            'ballade_latitude' => '44.02',
            'ballade_longitude' => '-1.25',
        ], $overrides);
    }

    public function test_index_is_public_and_lists_ballades(): void
    {
        Cache::forget('ballades.index');
        $ballade = Ballade::factory()->create(['ballade_name' => 'Unique Index Test Ballade']);

        $response = $this->getJson('/api/ballades');

        $response->assertStatus(200);
        // Not assertJsonFragment(): the dev DB has thousands of seeded
        // ballades, and re-encoding/sorting that whole payload per assertion
        // is expensive enough to exhaust memory under coverage collection.
        $found = collect($response->json('data'))->firstWhere('id', $ballade->id);
        $this->assertNotNull($found);
        $this->assertSame('Unique Index Test Ballade', $found['ballade_name']);
    }

    public function test_sort_by_date_desc_orders_most_recent_first(): void
    {
        $older = Ballade::factory()->create(['created_at' => now()->subDays(2)]);
        $newer = Ballade::factory()->create(['created_at' => now()]);

        $response = $this->getJson('/api/ballades/sortDateDesc');

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->search($newer->id) < $ids->search($older->id));
    }

    public function test_show_returns_ballade_with_relations(): void
    {
        $ballade = Ballade::factory()->create();

        $response = $this->getJson("/api/ballades/{$ballade->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure(['user', 'tags', 'is_liked']);
    }

    public function test_by_user_returns_only_authenticated_users_ballades(): void
    {
        $user = User::factory()->create();
        $mine = Ballade::factory()->create(['user' => $user->id]);
        Ballade::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson('/api/ballades-user');

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($mine->id));
        $this->assertCount(1, $ids);
    }

    public function test_guest_cannot_create_ballade(): void
    {
        $response = $this->postJson('/api/ballades', $this->payload());

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_create_ballade(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->postJson('/api/ballades', $this->payload());

        $response->assertStatus(200);
        $this->assertDatabaseHas('ballades', ['ballade_name' => 'Balade du chien', 'user' => $user->id]);
    }

    public function test_owner_can_update_their_ballade(): void
    {
        $owner = User::factory()->create();
        $ballade = Ballade::factory()->create(['user' => $owner->id]);

        $response = $this->actingAs($owner, 'api')->patchJson("/api/ballades/{$ballade->id}", $this->payload(['ballade_name' => 'Nouveau nom']));

        $response->assertStatus(200);
        $this->assertDatabaseHas('ballades', ['id' => $ballade->id, 'ballade_name' => 'Nouveau nom']);
    }

    public function test_non_owner_cannot_update_ballade(): void
    {
        $other = User::factory()->create();
        $ballade = Ballade::factory()->create();

        $response = $this->actingAs($other, 'api')->patchJson("/api/ballades/{$ballade->id}", $this->payload(['ballade_name' => 'Hack']));

        $response->assertStatus(403);
        $this->assertDatabaseMissing('ballades', ['id' => $ballade->id, 'ballade_name' => 'Hack']);
    }

    public function test_admin_can_update_any_ballade(): void
    {
        $admin = User::factory()->admin()->create();
        $ballade = Ballade::factory()->create();

        $response = $this->actingAs($admin, 'api')->patchJson("/api/ballades/{$ballade->id}", $this->payload(['ballade_name' => 'Modifié par admin']));

        $response->assertStatus(200);
        $this->assertDatabaseHas('ballades', ['id' => $ballade->id, 'ballade_name' => 'Modifié par admin', 'user' => $ballade->user]);
    }

    public function test_non_owner_cannot_delete_ballade(): void
    {
        $other = User::factory()->create();
        $ballade = Ballade::factory()->create();

        $response = $this->actingAs($other, 'api')->deleteJson("/api/ballades/{$ballade->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('ballades', ['id' => $ballade->id]);
    }

    public function test_owner_can_delete_their_ballade(): void
    {
        $owner = User::factory()->create();
        $ballade = Ballade::factory()->create(['user' => $owner->id]);

        $response = $this->actingAs($owner, 'api')->deleteJson("/api/ballades/{$ballade->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('ballades', ['id' => $ballade->id]);
    }

    public function test_user_can_like_and_unlike_a_ballade(): void
    {
        $user = User::factory()->create();
        $ballade = Ballade::factory()->create();

        $this->actingAs($user, 'api')->postJson("/api/ballades/{$ballade->id}/like")
            ->assertStatus(200)->assertJson(['is_liked' => true, 'likes_count' => 1]);

        $this->actingAs($user, 'api')->getJson('/api/ballades-liked')
            ->assertStatus(200);

        $this->actingAs($user, 'api')->deleteJson("/api/ballades/{$ballade->id}/like")
            ->assertStatus(200)->assertJson(['is_liked' => false, 'likes_count' => 0]);
    }

    public function test_non_admin_cannot_bulk_update_status(): void
    {
        $user = User::factory()->create();
        $ballade = Ballade::factory()->create(['status' => 'en_attente']);

        $response = $this->actingAs($user, 'api')->patchJson('/api/ballades/bulk-status', [
            'ids' => [$ballade->id],
            'status' => 'publie',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_bulk_update_status(): void
    {
        $admin = User::factory()->admin()->create();
        $ballade = Ballade::factory()->create(['status' => 'en_attente']);

        $response = $this->actingAs($admin, 'api')->patchJson('/api/ballades/bulk-status', [
            'ids' => [$ballade->id],
            'status' => 'publie',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('ballades', ['id' => $ballade->id, 'status' => 'publie']);
    }

    public function test_admin_can_bulk_delete_ballades(): void
    {
        $admin = User::factory()->admin()->create();
        $ballade = Ballade::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson('/api/ballades/bulk', [
            'ids' => [$ballade->id],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('ballades', ['id' => $ballade->id]);
    }
}
