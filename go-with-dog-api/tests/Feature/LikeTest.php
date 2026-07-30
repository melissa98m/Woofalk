<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Ballade;
use App\Models\Category;
use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class LikeTest extends TestCase
{
    use DatabaseTransactions;

    private function place(): Place
    {
        $address = Address::create([
            'address' => '1 rue du Chien',
            'city' => 'Lyon',
            'postal_code' => '69000',
            'latitude' => 45,
            'longitude' => 4,
        ]);
        $category = Category::create(['category_name' => 'Parc']);

        return Place::create([
            'place_name' => 'Parc canin',
            'place_description' => 'Un joli parc',
            'address' => $address->id,
            'category' => $category->id,
            'user' => User::factory()->create()->id,
            'status' => 'publie',
        ]);
    }

    private function ballade(): Ballade
    {
        return Ballade::factory()->create();
    }

    public function test_user_can_like_a_place(): void
    {
        $user = User::factory()->create();
        $place = $this->place();

        $response = $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/like");

        $response->assertStatus(200);
        $response->assertJson(['is_liked' => true, 'likes_count' => 1]);
        $this->assertDatabaseHas('place_likes', ['place_id' => $place->id, 'user_id' => $user->id]);
    }

    public function test_liking_a_place_twice_does_not_duplicate(): void
    {
        $user = User::factory()->create();
        $place = $this->place();

        $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/like");
        $response = $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/like");

        $response->assertStatus(200);
        $response->assertJson(['likes_count' => 1]);
        $this->assertDatabaseCount('place_likes', 1);
    }

    public function test_user_can_unlike_a_place(): void
    {
        $user = User::factory()->create();
        $place = $this->place();
        $place->likedByUsers()->attach($user->id);

        $response = $this->actingAs($user, 'api')->deleteJson("/api/places/{$place->id}/like");

        $response->assertStatus(200);
        $response->assertJson(['is_liked' => false, 'likes_count' => 0]);
        $this->assertDatabaseMissing('place_likes', ['place_id' => $place->id, 'user_id' => $user->id]);
    }

    public function test_guest_cannot_like_a_place(): void
    {
        $place = $this->place();

        $response = $this->postJson("/api/places/{$place->id}/like");

        $response->assertStatus(401);
    }

    public function test_user_can_list_liked_places(): void
    {
        $user = User::factory()->create();
        $liked = $this->place();
        $notLiked = $this->place();
        $liked->likedByUsers()->attach($user->id);

        $response = $this->actingAs($user, 'api')->getJson('/api/places-liked');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['id' => $liked->id, 'is_liked' => true]);
        $response->assertJsonMissing(['id' => $notLiked->id]);
    }

    public function test_place_index_reports_like_state_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $place = $this->place();
        $place->likedByUsers()->attach($user->id);

        $response = $this->actingAs($user, 'api')->getJson('/api/places');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $place->id, 'is_liked' => true, 'likes_count' => 1]);
    }

    public function test_user_can_like_and_unlike_a_ballade(): void
    {
        $user = User::factory()->create();
        $ballade = $this->ballade();

        $like = $this->actingAs($user, 'api')->postJson("/api/ballades/{$ballade->id}/like");
        $like->assertStatus(200);
        $like->assertJson(['is_liked' => true, 'likes_count' => 1]);

        $unlike = $this->actingAs($user, 'api')->deleteJson("/api/ballades/{$ballade->id}/like");
        $unlike->assertStatus(200);
        $unlike->assertJson(['is_liked' => false, 'likes_count' => 0]);
    }

    public function test_user_can_list_liked_ballades(): void
    {
        $user = User::factory()->create();
        $ballade = $this->ballade();
        $ballade->likedByUsers()->attach($user->id);

        $response = $this->actingAs($user, 'api')->getJson('/api/ballades-liked');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $ballade->id, 'is_liked' => true]);
    }

    public function test_deleting_a_user_removes_their_likes(): void
    {
        $user = User::factory()->create();
        $place = $this->place();
        $place->likedByUsers()->attach($user->id);

        $user->delete();

        $this->assertDatabaseMissing('place_likes', ['place_id' => $place->id]);
    }
}
