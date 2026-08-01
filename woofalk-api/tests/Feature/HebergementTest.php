<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Category;
use App\Models\Hebergement;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class HebergementTest extends TestCase
{
    use DatabaseTransactions;

    public function test_index(): void
    {
        Cache::forget('hebergements.index');
        $hebergement = Hebergement::factory()->create(['hebergement_name' => 'Unique Index Test Hebergement', 'status' => 'publie']);

        $response = $this->get('/api/hebergements');

        $response->assertStatus(200);
        // Not assertJsonFragment(): the dev DB has thousands of seeded
        // hebergements, and re-encoding/sorting that whole payload per
        // assertion is expensive enough to exhaust memory under coverage
        // collection.
        $found = collect($response->json('data'))->firstWhere('id', $hebergement->id);
        $this->assertNotNull($found);
        $this->assertSame('Unique Index Test Hebergement', $found['hebergement_name']);
    }

    public function test_index_hides_pending_hebergements_from_guests(): void
    {
        Cache::forget('hebergements.index');
        $hebergement = Hebergement::factory()->create(['status' => 'en_attente']);

        $response = $this->getJson('/api/hebergements');

        $response->assertStatus(200);
        $this->assertNull(collect($response->json('data'))->firstWhere('id', $hebergement->id));
    }

    public function test_index_includes_pending_hebergements_for_moderators(): void
    {
        Cache::forget('hebergements.index');
        $moderator = User::factory()->moderator()->create();
        $hebergement = Hebergement::factory()->create(['status' => 'en_attente']);

        $response = $this->actingAs($moderator, 'api')->getJson('/api/hebergements');

        $response->assertStatus(200);
        $this->assertNotNull(collect($response->json('data'))->firstWhere('id', $hebergement->id));
    }

    public function test_show_returns_hebergement_with_relations(): void
    {
        $hebergement = Hebergement::factory()->create(['status' => 'publie']);

        $response = $this->getJson("/api/hebergements/{$hebergement->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure(['address', 'category', 'user', 'tags', 'is_liked']);
    }

    public function test_show_returns_404_for_pending_hebergement_to_guest(): void
    {
        $hebergement = Hebergement::factory()->create(['status' => 'en_attente']);

        $response = $this->getJson("/api/hebergements/{$hebergement->id}");

        $response->assertStatus(404);
    }

    public function test_by_user_returns_only_authenticated_users_hebergements(): void
    {
        $user = User::factory()->create();
        $mine = Hebergement::factory()->create(['user' => $user->id]);
        Hebergement::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson('/api/hebergements-user');

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($mine->id));
        $this->assertCount(1, $ids);
    }

    public function test_user_can_like_and_unlike_a_hebergement(): void
    {
        $user = User::factory()->create();
        $hebergement = Hebergement::factory()->create();

        $this->actingAs($user, 'api')->postJson("/api/hebergements/{$hebergement->id}/like")
            ->assertStatus(200)->assertJson(['is_liked' => true, 'likes_count' => 1]);

        $this->actingAs($user, 'api')->getJson('/api/hebergements-liked')->assertStatus(200);

        $this->actingAs($user, 'api')->deleteJson("/api/hebergements/{$hebergement->id}/like")
            ->assertStatus(200)->assertJson(['is_liked' => false, 'likes_count' => 0]);
    }

    public function test_admin_can_update_any_hebergement(): void
    {
        $admin = User::factory()->admin()->create();
        $hebergement = Hebergement::factory()->create();

        $response = $this->actingAs($admin, 'api')->patchJson("/api/hebergements/{$hebergement->id}", [
            'hebergement_name' => 'Modifié par admin',
            'hebergement_description' => $hebergement->hebergement_description,
            'address' => $hebergement->address,
            'category' => $hebergement->category,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('hebergements', ['id' => $hebergement->id, 'hebergement_name' => 'Modifié par admin', 'user' => $hebergement->user]);
    }

    public function test_non_admin_cannot_bulk_update_status(): void
    {
        $user = User::factory()->create();
        $hebergement = Hebergement::factory()->create(['status' => 'en_attente']);

        $response = $this->actingAs($user, 'api')->patchJson('/api/hebergements/bulk-status', [
            'ids' => [$hebergement->id],
            'status' => 'publie',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_bulk_update_status(): void
    {
        $admin = User::factory()->admin()->create();
        $hebergement = Hebergement::factory()->create(['status' => 'en_attente']);

        $response = $this->actingAs($admin, 'api')->patchJson('/api/hebergements/bulk-status', [
            'ids' => [$hebergement->id],
            'status' => 'publie',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('hebergements', ['id' => $hebergement->id, 'status' => 'publie']);
    }

    public function test_moderator_can_bulk_update_status(): void
    {
        $moderator = User::factory()->moderator()->create();
        $hebergement = Hebergement::factory()->create(['status' => 'en_attente']);

        $response = $this->actingAs($moderator, 'api')->patchJson('/api/hebergements/bulk-status', [
            'ids' => [$hebergement->id],
            'status' => 'publie',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('hebergements', ['id' => $hebergement->id, 'status' => 'publie']);
    }

    public function test_moderator_cannot_bulk_delete_hebergements(): void
    {
        $moderator = User::factory()->moderator()->create();
        $hebergement = Hebergement::factory()->create();

        $response = $this->actingAs($moderator, 'api')->deleteJson('/api/hebergements/bulk', [
            'ids' => [$hebergement->id],
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('hebergements', ['id' => $hebergement->id]);
    }

    public function test_admin_can_bulk_delete_hebergements(): void
    {
        $admin = User::factory()->admin()->create();
        $hebergement = Hebergement::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson('/api/hebergements/bulk', [
            'ids' => [$hebergement->id],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('hebergements', ['id' => $hebergement->id]);
    }

    public function test_create_hebergement(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create();
        $category = Category::factory()->create();

        $data = [
            'hebergement_name' => 'Gîte du Chien Heureux',
            'hebergement_description' => 'lorem ipsum',
            'hebergement_website' => 'https://example.fr',
            'price_indication' => '20€/jour',
            'address' => $address->id,
            'category' => $category->id,
            'tags' => [],
        ];

        $response = $this->actingAs($user, 'api')->postJson('/api/hebergements', $data);

        $response->assertStatus(200);
        $this->assertDatabaseHas('hebergements', ['hebergement_name' => 'Gîte du Chien Heureux']);
    }

    public function test_update_hebergement(): void
    {
        $owner = User::factory()->create();
        $hebergement = Hebergement::factory()->create(['user' => $owner->id]);

        $data = [
            'hebergement_name' => 'Nouveau nom',
            'hebergement_description' => 'lorem ipsum modifié',
            'hebergement_website' => 'https://example.fr',
            'price_indication' => '25€/nuit',
            'address' => $hebergement->address,
            'category' => $hebergement->category,
            'status' => 'publie',
            'tags' => [],
        ];

        $response = $this->actingAs($owner, 'api')->patchJson("/api/hebergements/{$hebergement->id}", $data);

        $response->assertStatus(200);
        $this->assertDatabaseHas('hebergements', ['id' => $hebergement->id, 'hebergement_name' => 'Nouveau nom']);
    }

    public function test_update_hebergement_forbidden_for_non_owner(): void
    {
        $otherUser = User::factory()->create();
        $hebergement = Hebergement::factory()->create();

        $data = [
            'hebergement_name' => 'Nouveau nom',
            'hebergement_description' => 'lorem ipsum modifié',
            'address' => $hebergement->address,
            'category' => $hebergement->category,
            'tags' => [],
        ];

        $response = $this->actingAs($otherUser, 'api')->patchJson("/api/hebergements/{$hebergement->id}", $data);

        $response->assertStatus(403);
        $this->assertDatabaseHas('hebergements', ['id' => $hebergement->id, 'hebergement_name' => $hebergement->hebergement_name]);
    }

    public function test_delete_hebergement(): void
    {
        $owner = User::factory()->create();
        $hebergement = Hebergement::factory()->create(['user' => $owner->id]);

        $response = $this->actingAs($owner, 'api')->deleteJson("/api/hebergements/{$hebergement->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('hebergements', ['id' => $hebergement->id]);
    }

    public function test_delete_hebergement_forbidden_for_non_owner(): void
    {
        $otherUser = User::factory()->create();
        $hebergement = Hebergement::factory()->create();

        $response = $this->actingAs($otherUser, 'api')->deleteJson("/api/hebergements/{$hebergement->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('hebergements', ['id' => $hebergement->id]);
    }

    public function test_guest_cannot_create_hebergement(): void
    {
        $address = Address::factory()->create();
        $category = Category::factory()->create();

        $response = $this->postJson('/api/hebergements', [
            'hebergement_name' => 'Test',
            'hebergement_description' => 'lorem ipsum',
            'address' => $address->id,
            'category' => $category->id,
        ]);

        $response->assertStatus(401);
    }
}
