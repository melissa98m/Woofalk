<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AddressTest extends TestCase
{
    use DatabaseTransactions;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'address' => '1 rue du Chien',
            'postal_code' => '75001',
            'city' => 'Paris',
            'latitude' => '48.8566',
            'longitude' => '2.3522',
        ], $overrides);
    }

    public function test_index_is_public_and_lists_addresses(): void
    {
        Cache::forget('addresses.index');
        $address = Address::factory()->create(['address' => 'Unique Index Test Address']);

        $response = $this->getJson('/api/addresses');

        $response->assertStatus(200);
        $found = collect($response->json('data'))->firstWhere('id', $address->id);
        $this->assertNotNull($found);
        $this->assertSame('Unique Index Test Address', $found['address']);
    }

    public function test_show_returns_address(): void
    {
        $address = Address::factory()->create();

        $response = $this->getJson("/api/addresses/{$address->id}");

        $response->assertStatus(200);
        $response->assertJson(['id' => $address->id]);
    }

    public function test_guest_cannot_create_address(): void
    {
        $response = $this->postJson('/api/addresses', $this->payload());

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_create_address(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->postJson('/api/addresses', $this->payload());

        $response->assertStatus(200);
        $this->assertDatabaseHas('addresses', ['address' => '1 rue du Chien', 'city' => 'Paris']);
    }

    public function test_create_address_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->postJson('/api/addresses', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['address', 'postal_code', 'city', 'latitude', 'longitude']);
    }

    public function test_non_admin_cannot_update_address(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create();

        $response = $this->actingAs($user, 'api')->patchJson("/api/addresses/{$address->id}", $this->payload());

        $response->assertStatus(403);
    }

    public function test_admin_can_update_address(): void
    {
        $admin = User::factory()->admin()->create();
        $address = Address::factory()->create();

        $response = $this->actingAs($admin, 'api')->patchJson("/api/addresses/{$address->id}", $this->payload(['city' => 'Lyon']));

        $response->assertStatus(200);
        $this->assertDatabaseHas('addresses', ['id' => $address->id, 'city' => 'Lyon']);
    }

    public function test_non_admin_cannot_delete_address(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create();

        $response = $this->actingAs($user, 'api')->deleteJson("/api/addresses/{$address->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('addresses', ['id' => $address->id]);
    }

    public function test_admin_can_delete_address(): void
    {
        $admin = User::factory()->admin()->create();
        $address = Address::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson("/api/addresses/{$address->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('addresses', ['id' => $address->id]);
    }

    public function test_non_admin_cannot_bulk_delete_addresses(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create();

        $response = $this->actingAs($user, 'api')->deleteJson('/api/addresses/bulk', ['ids' => [$address->id]]);

        $response->assertStatus(403);
    }

    public function test_admin_can_bulk_delete_addresses(): void
    {
        $admin = User::factory()->admin()->create();
        $address = Address::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson('/api/addresses/bulk', ['ids' => [$address->id]]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('addresses', ['id' => $address->id]);
    }
}
