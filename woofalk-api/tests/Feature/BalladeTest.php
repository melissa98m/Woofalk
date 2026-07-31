<?php

namespace Tests\Feature;

use App\Models\Ballade;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class BalladeTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Teste si la page de la liste des ballades est accessible
     */
    public function test_index(): void
    {
        $response = $this->get('/api/ballades');

        $response->assertStatus(200);
    }

    /**
     * Teste si l'API peut créer une ballade
     */
    public function test_create_ballade(): void
    {
        $user = User::factory()->create();
        $tag = Tag::factory()->create(['scope' => 'both']);

        $data = [
            'ballade_name' => 'test1',
            'distance' => '150',
            'denivele' => '1000',
            'ballade_description' => 'lorem ipsum',
            'ballade_latitude' => '44.02',
            'ballade_longitude' => '-10.25',
            'tags' => [$tag->id],
        ];

        $response = $this->actingAs($user, 'api')->postJson('/api/ballades', $data);

        $response->assertStatus(200);
    }

    /**
     * Teste si l'API peut modifier une ballade existante
     *
     * @return void
     */
    public function test_update_ballade()
    {
        $user = User::factory()->create();
        $ballade = Ballade::factory()->create(['user' => $user->id]);
        $tag = Tag::factory()->create(['scope' => 'both']);

        $data = [
            'ballade_name' => 'tes88t51',
            'distance' => '150',
            'denivele' => '1000',
            'ballade_description' => 'lorem ipsum',
            'ballade_latitude' => '44.02',
            'ballade_longitude' => '-10.25',
            'tags' => [$tag->id],
        ];
        $response = $this->actingAs($user, 'api')->patchJson("/api/ballades/{$ballade->id}", $data);
        $response->assertStatus(200);
    }

    /**
     * Teste si l'API peut supprimer une ballade existante
     *
     * @return void
     */
    public function test_delete_ballade()
    {
        $user = User::factory()->create();
        $ballade = Ballade::factory()->create(['user' => $user->id]);

        $response = $this->actingAs($user, 'api')->delete("/api/ballades/{$ballade->id}");
        $response->assertStatus(200);
    }
}
