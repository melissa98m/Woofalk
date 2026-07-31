<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Category;
use App\Models\Place;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PlaceControllerTest extends TestCase
{
    use DatabaseTransactions;

    public function test_index_is_public_and_lists_places(): void
    {
        // The dev database this suite runs against is pre-seeded with a large
        // volume of fake places, so we assert presence rather than an exact
        // count. The listing is also cached (see CachesListing) — a prior
        // test hitting this endpoint before this one's factory row exists
        // would otherwise serve a stale snapshot from the in-process cache.
        Cache::forget('places.index');
        $place = Place::factory()->create(['place_name' => 'Unique Index Test Place']);

        $response = $this->getJson('/api/places');

        $response->assertStatus(200);
        // Not assertJsonFragment(): the dev DB has thousands of seeded
        // places, and re-encoding/sorting that whole payload per assertion
        // is expensive enough to exhaust memory under coverage collection.
        $found = collect($response->json('data'))->firstWhere('id', $place->id);
        $this->assertNotNull($found);
        $this->assertSame('Unique Index Test Place', $found['place_name']);
    }

    public function test_show_returns_place_with_relations(): void
    {
        $place = Place::factory()->create();

        $response = $this->getJson("/api/places/{$place->id}");

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $place->id]);
        $response->assertJsonStructure(['address', 'category', 'user', 'tags', 'is_liked']);
    }

    public function test_by_user_returns_only_authenticated_users_places(): void
    {
        $user = User::factory()->create();
        $mine = Place::factory()->create(['user' => $user->id]);
        Place::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson('/api/places-user');

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($mine->id));
        $this->assertCount(1, $ids);
    }

    public function test_guest_cannot_create_place(): void
    {
        $address = Address::factory()->create();
        $category = Category::factory()->create();

        $response = $this->postJson('/api/places', [
            'place_name' => 'Test',
            'place_description' => 'lorem',
            'address' => $address->id,
            'category' => $category->id,
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_create_place(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create();
        $category = Category::factory()->create();
        $tag = Tag::factory()->create(['scope' => 'place']);

        $response = $this->actingAs($user, 'api')->postJson('/api/places', [
            'place_name' => 'Chez le chien',
            'place_description' => 'lorem ipsum',
            'address' => $address->id,
            'category' => $category->id,
            'tags' => [$tag->id],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('places', ['place_name' => 'Chez le chien', 'user' => $user->id]);
    }

    public function test_owner_can_update_their_place(): void
    {
        $owner = User::factory()->create();
        $place = Place::factory()->create(['user' => $owner->id]);

        $response = $this->actingAs($owner, 'api')->patchJson("/api/places/{$place->id}", [
            'place_name' => 'Nouveau nom',
            'place_description' => $place->place_description,
            'address' => $place->address,
            'category' => $place->category,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('places', ['id' => $place->id, 'place_name' => 'Nouveau nom']);
    }

    public function test_non_owner_cannot_update_place(): void
    {
        $other = User::factory()->create();
        $place = Place::factory()->create();

        $response = $this->actingAs($other, 'api')->patchJson("/api/places/{$place->id}", [
            'place_name' => 'Hack',
            'place_description' => $place->place_description,
            'address' => $place->address,
            'category' => $place->category,
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('places', ['id' => $place->id, 'place_name' => 'Hack']);
    }

    public function test_admin_can_update_any_place(): void
    {
        $admin = User::factory()->admin()->create();
        $place = Place::factory()->create();

        $response = $this->actingAs($admin, 'api')->patchJson("/api/places/{$place->id}", [
            'place_name' => 'Modifié par admin',
            'place_description' => $place->place_description,
            'address' => $place->address,
            'category' => $place->category,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('places', ['id' => $place->id, 'place_name' => 'Modifié par admin', 'user' => $place->user]);
    }

    public function test_non_owner_cannot_delete_place(): void
    {
        $other = User::factory()->create();
        $place = Place::factory()->create();

        $response = $this->actingAs($other, 'api')->deleteJson("/api/places/{$place->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('places', ['id' => $place->id]);
    }

    public function test_owner_can_delete_their_place(): void
    {
        $owner = User::factory()->create();
        $place = Place::factory()->create(['user' => $owner->id]);

        $response = $this->actingAs($owner, 'api')->deleteJson("/api/places/{$place->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('places', ['id' => $place->id]);
    }

    public function test_user_can_like_and_unlike_a_place(): void
    {
        $user = User::factory()->create();
        $place = Place::factory()->create();

        $likeResponse = $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/like");
        $likeResponse->assertStatus(200)->assertJson(['is_liked' => true, 'likes_count' => 1]);

        $listResponse = $this->actingAs($user, 'api')->getJson('/api/places-liked');
        $listResponse->assertStatus(200);
        $this->assertCount(1, $listResponse->json('data'));

        $unlikeResponse = $this->actingAs($user, 'api')->deleteJson("/api/places/{$place->id}/like");
        $unlikeResponse->assertStatus(200)->assertJson(['is_liked' => false, 'likes_count' => 0]);
    }

    public function test_non_admin_cannot_bulk_update_status(): void
    {
        $user = User::factory()->create();
        $place = Place::factory()->create(['status' => 'en_attente']);

        $response = $this->actingAs($user, 'api')->patchJson('/api/places/bulk-status', [
            'ids' => [$place->id],
            'status' => 'publie',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_bulk_update_status(): void
    {
        $admin = User::factory()->admin()->create();
        $place = Place::factory()->create(['status' => 'en_attente']);

        $response = $this->actingAs($admin, 'api')->patchJson('/api/places/bulk-status', [
            'ids' => [$place->id],
            'status' => 'publie',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('places', ['id' => $place->id, 'status' => 'publie']);
    }

    public function test_admin_can_bulk_delete_places(): void
    {
        $admin = User::factory()->admin()->create();
        $place = Place::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson('/api/places/bulk', [
            'ids' => [$place->id],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('places', ['id' => $place->id]);
    }
}
