<?php

namespace Tests\Feature;

use App\Models\Ballade;
use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
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

    public function test_admin_can_bulk_delete_users_excluding_themselves(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson('/api/users/bulk', [
            'ids' => [$admin->id, $other->id],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $other->id]);
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_bulk_delete_anonymizes_places_and_ballades(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->create();
        $place = Place::factory()->create(['user' => $other->id]);

        $this->actingAs($admin, 'api')->deleteJson('/api/users/bulk', ['ids' => [$other->id]])
            ->assertStatus(200);

        $this->assertDatabaseHas('places', ['id' => $place->id, 'user' => null]);
    }

    public function test_non_admin_cannot_bulk_delete_users(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($user, 'api')->deleteJson('/api/users/bulk', ['ids' => [$other->id]]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $other->id]);
    }

    public function test_user_can_change_their_password_with_correct_old_password(): void
    {
        $user = User::factory()->create(); // factory password hash is "password"

        $response = $this->actingAs($user, 'api')->postJson('/api/users/change-password', [
            'old_password' => 'password',
            'new_password' => 'newpassword123',
            'confirm_password' => 'newpassword123',
        ]);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('newpassword123', $user->fresh()->password));
    }

    public function test_change_password_fails_with_wrong_old_password(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->postJson('/api/users/change-password', [
            'old_password' => 'wrong-password',
            'new_password' => 'newpassword123',
            'confirm_password' => 'newpassword123',
        ]);

        $response->assertStatus(400);
        $this->assertTrue(Hash::check('password', $user->fresh()->password));
    }

    public function test_change_password_requires_matching_confirmation(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->postJson('/api/users/change-password', [
            'old_password' => 'password',
            'new_password' => 'newpassword123',
            'confirm_password' => 'does-not-match',
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_can_promote_another_user_to_moderator(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($admin, 'api')->patchJson("/api/users/{$other->id}/roles", [
            'roles' => ['ROLE_MODERATOR'],
        ]);

        $response->assertStatus(200);
        $this->assertSame(['ROLE_MODERATOR'], json_decode($other->fresh()->roles, true));
    }

    public function test_moderator_cannot_list_all_users(): void
    {
        $moderator = User::factory()->moderator()->create();

        $response = $this->actingAs($moderator, 'api')->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_moderator_cannot_change_roles(): void
    {
        $moderator = User::factory()->moderator()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($moderator, 'api')->patchJson("/api/users/{$other->id}/roles", [
            'roles' => ['ROLE_ADMIN'],
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_promote_another_user_to_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($admin, 'api')->patchJson("/api/users/{$other->id}/roles", [
            'roles' => ['ROLE_ADMIN'],
        ]);

        $response->assertStatus(200);
        $this->assertSame(['ROLE_ADMIN'], json_decode($other->fresh()->roles, true));
    }

    public function test_admin_can_demote_another_admin_to_user(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->patchJson("/api/users/{$other->id}/roles", [
            'roles' => ['ROLE_USER'],
        ]);

        $response->assertStatus(200);
        $this->assertSame(['ROLE_USER'], json_decode($other->fresh()->roles, true));
    }

    public function test_admin_cannot_change_their_own_role(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->patchJson("/api/users/{$admin->id}/roles", [
            'roles' => ['ROLE_USER'],
        ]);

        $response->assertStatus(422);
        $this->assertSame(['ROLE_ADMIN'], json_decode($admin->fresh()->roles, true));
    }

    public function test_non_admin_cannot_change_roles(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($user, 'api')->patchJson("/api/users/{$other->id}/roles", [
            'roles' => ['ROLE_ADMIN'],
        ]);

        $response->assertStatus(403);
        $this->assertSame(['ROLE_USER'], json_decode($other->fresh()->roles, true));
    }

    public function test_update_roles_rejects_unknown_role_values(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($admin, 'api')->patchJson("/api/users/{$other->id}/roles", [
            'roles' => ['ROLE_SUPERUSER'],
        ]);

        $response->assertStatus(422);
    }

    public function test_current_user_id_endpoint_returns_authenticated_id(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson('/api/users/current-user');

        $response->assertStatus(200);
        $response->assertJson(['status' => 'Success', 'data' => $user->id]);
    }
}
