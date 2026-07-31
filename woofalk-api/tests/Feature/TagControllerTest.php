<?php

namespace Tests\Feature;

use App\Models\Place;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class TagControllerTest extends TestCase
{
    use DatabaseTransactions;

    public function test_index_is_public_and_lists_tags(): void
    {
        Cache::forget('tags.index');
        $tag = Tag::factory()->create(['tag_name' => 'Unique Index Test Tag']);

        $response = $this->getJson('/api/tags');

        $response->assertStatus(200);
        $found = collect($response->json('data'))->firstWhere('id', $tag->id);
        $this->assertNotNull($found);
    }

    public function test_index_can_filter_by_scope(): void
    {
        Cache::forget('tags.index.place');
        $place = Tag::factory()->create(['scope' => 'place', 'tag_name' => 'Scope Place Tag Test']);
        Tag::factory()->create(['scope' => 'ballade', 'tag_name' => 'Scope Ballade Tag Test']);

        $response = $this->getJson('/api/tags?scope=place');

        $response->assertStatus(200);
        $names = collect($response->json('data'))->pluck('tag_name');
        $this->assertTrue($names->contains('Scope Place Tag Test'));
        $this->assertFalse($names->contains('Scope Ballade Tag Test'));
    }

    public function test_show_returns_tag(): void
    {
        $tag = Tag::factory()->create();

        $response = $this->getJson("/api/tags/{$tag->id}");

        $response->assertStatus(200);
        $response->assertJson(['id' => $tag->id]);
    }

    public function test_guest_cannot_create_tag(): void
    {
        $response = $this->postJson('/api/tags', ['tag_name' => 'Test', 'color' => '#fff']);

        $response->assertStatus(401);
    }

    public function test_non_admin_cannot_create_tag(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->postJson('/api/tags', ['tag_name' => 'Test', 'color' => '#fff']);

        $response->assertStatus(403);
    }

    public function test_admin_can_create_tag(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->postJson('/api/tags', ['tag_name' => 'Calme', 'color' => '#00ff00', 'scope' => 'place']);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tags', ['tag_name' => 'Calme', 'scope' => 'place']);
    }

    public function test_admin_can_update_tag(): void
    {
        $admin = User::factory()->admin()->create();
        $tag = Tag::factory()->create(['scope' => 'both']);

        $response = $this->actingAs($admin, 'api')->patchJson("/api/tags/{$tag->id}", [
            'tag_name' => 'Modifié',
            'color' => $tag->color,
            'scope' => 'place',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tags', ['id' => $tag->id, 'tag_name' => 'Modifié', 'scope' => 'place']);
    }

    public function test_updating_tag_scope_detaches_it_from_now_out_of_scope_resources(): void
    {
        $admin = User::factory()->admin()->create();
        $tag = Tag::factory()->create(['scope' => 'both']);
        $place = Place::factory()->create();
        $place->tags()->attach($tag->id);

        $this->actingAs($admin, 'api')->patchJson("/api/tags/{$tag->id}", [
            'tag_name' => $tag->tag_name,
            'color' => $tag->color,
            'scope' => 'ballade',
        ])->assertStatus(200);

        $this->assertDatabaseMissing('place_tag', ['place_id' => $place->id, 'tag_id' => $tag->id]);
    }

    public function test_non_admin_cannot_delete_tag(): void
    {
        $user = User::factory()->create();
        $tag = Tag::factory()->create();

        $response = $this->actingAs($user, 'api')->deleteJson("/api/tags/{$tag->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('tags', ['id' => $tag->id]);
    }

    public function test_admin_can_delete_tag(): void
    {
        $admin = User::factory()->admin()->create();
        $tag = Tag::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson("/api/tags/{$tag->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('tags', ['id' => $tag->id]);
    }

    public function test_admin_can_bulk_delete_tags(): void
    {
        $admin = User::factory()->admin()->create();
        $tag = Tag::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson('/api/tags/bulk', ['ids' => [$tag->id]]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('tags', ['id' => $tag->id]);
    }

    public function test_non_admin_cannot_bulk_delete_tags(): void
    {
        $user = User::factory()->create();
        $tag = Tag::factory()->create();

        $response = $this->actingAs($user, 'api')->deleteJson('/api/tags/bulk', ['ids' => [$tag->id]]);

        $response->assertStatus(403);
    }
}
