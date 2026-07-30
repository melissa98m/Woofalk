<?php

namespace Tests\Feature;

use App\Models\Ballade;
use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class UserAuthorizationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_user_cannot_list_all_users(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_admin_can_list_all_users(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/users');

        $response->assertStatus(200);
    }

    public function test_user_can_view_own_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson("/api/users/{$user->id}");

        $response->assertStatus(200);
        $response->assertJson(['id' => $user->id]);
    }

    public function test_user_cannot_view_another_users_profile(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson("/api/users/{$other->id}");

        $response->assertStatus(403);
    }

    public function test_admin_can_view_any_profile(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($admin, 'api')->getJson("/api/users/{$other->id}");

        $response->assertStatus(200);
    }

    public function test_user_can_delete_own_account(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->deleteJson("/api/users/{$user->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_user_cannot_delete_another_users_account(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($user, 'api')->deleteJson("/api/users/{$other->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $other->id]);
    }

    public function test_admin_can_delete_any_account(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson("/api/users/{$other->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $other->id]);
    }

    public function test_deleting_account_anonymizes_places_and_ballades_instead_of_deleting_them(): void
    {
        $user = User::factory()->create();
        $place = Place::factory()->create(['user' => $user->id]);
        $ballade = Ballade::factory()->create(['user' => $user->id]);

        $this->actingAs($user, 'api')->deleteJson("/api/users/{$user->id}")->assertStatus(200);

        $this->assertDatabaseHas('places', ['id' => $place->id, 'user' => null]);
        $this->assertDatabaseHas('ballades', ['id' => $ballade->id, 'user' => null]);
    }

    public function test_export_my_data_returns_own_data_only(): void
    {
        $user = User::factory()->create();
        $place = Place::factory()->create(['user' => $user->id]);

        $response = $this->actingAs($user, 'api')->getJson('/api/users/me/export');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $place->id]);
        $response->assertJsonMissingPath('account.password');
        $response->assertJsonMissingPath('account.roles');
    }
}
