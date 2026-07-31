<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CategoryControllerTest extends TestCase
{
    use DatabaseTransactions;

    public function test_index_is_public_and_lists_categories(): void
    {
        Cache::forget('categories.index');
        $category = Category::factory()->create(['category_name' => 'Unique Index Test Category']);

        $response = $this->getJson('/api/categories');

        $response->assertStatus(200);
        $found = collect($response->json('data'))->firstWhere('id', $category->id);
        $this->assertNotNull($found);
    }

    public function test_index_can_filter_by_scope(): void
    {
        Cache::forget('categories.index.place');
        $place = Category::factory()->create(['scope' => 'place', 'category_name' => 'Scope Place Test']);
        Category::factory()->create(['scope' => 'hebergement', 'category_name' => 'Scope Hebergement Test']);

        $response = $this->getJson('/api/categories?scope=place');

        $response->assertStatus(200);
        $names = collect($response->json('data'))->pluck('category_name');
        $this->assertTrue($names->contains('Scope Place Test'));
        $this->assertFalse($names->contains('Scope Hebergement Test'));
    }

    public function test_show_returns_category(): void
    {
        $category = Category::factory()->create();

        $response = $this->getJson("/api/categories/{$category->id}");

        $response->assertStatus(200);
        $response->assertJson(['id' => $category->id]);
    }

    public function test_guest_cannot_create_category(): void
    {
        $response = $this->postJson('/api/categories', ['category_name' => 'Test']);

        $response->assertStatus(401);
    }

    public function test_non_admin_cannot_create_category(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->postJson('/api/categories', ['category_name' => 'Test']);

        $response->assertStatus(403);
    }

    public function test_admin_can_create_category(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->postJson('/api/categories', ['category_name' => 'Parcs', 'scope' => 'place']);

        $response->assertStatus(200);
        $this->assertDatabaseHas('categories', ['category_name' => 'Parcs', 'scope' => 'place']);
    }

    public function test_admin_can_update_category(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin, 'api')->patchJson("/api/categories/{$category->id}", ['category_name' => 'Modifié']);

        $response->assertStatus(200);
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'category_name' => 'Modifié']);
    }

    public function test_non_admin_cannot_delete_category(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($user, 'api')->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    public function test_admin_can_delete_category(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_admin_can_bulk_delete_categories(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson('/api/categories/bulk', ['ids' => [$category->id]]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_non_admin_cannot_bulk_delete_categories(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($user, 'api')->deleteJson('/api/categories/bulk', ['ids' => [$category->id]]);

        $response->assertStatus(403);
    }
}
