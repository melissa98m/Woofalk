<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Category;
use App\Models\Hebergement;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class HebergementTest extends TestCase
{
    use DatabaseTransactions;

    public function test_index(): void
    {
        $response = $this->get('/api/hebergements');

        $response->assertStatus(200);
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
        $user = User::factory()->create();
        $hebergement = Hebergement::factory()->create();

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

        $response = $this->actingAs($user, 'api')->patchJson("/api/hebergements/{$hebergement->id}", $data);

        $response->assertStatus(200);
        $this->assertDatabaseHas('hebergements', ['id' => $hebergement->id, 'hebergement_name' => 'Nouveau nom']);
    }

    public function test_delete_hebergement(): void
    {
        $user = User::factory()->create();
        $hebergement = Hebergement::factory()->create();

        $response = $this->actingAs($user, 'api')->deleteJson("/api/hebergements/{$hebergement->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('hebergements', ['id' => $hebergement->id]);
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
