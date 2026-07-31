<?php

namespace Tests\Feature;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class TagTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Teste si la page de la liste des tags est accessible
     */
    public function test_index(): void
    {
        $response = $this->get('/api/tags');

        $response->assertStatus(200);
    }

    /**
     * Teste si l'API peut créer un tag
     */
    public function test_create_tag(): void
    {
        $admin = User::factory()->admin()->create();

        $data = [
            'tag_name' => 'test',
            'color' => '#0000',
        ];

        $response = $this->actingAs($admin, 'api')->postJson('/api/tags', $data);

        $response->assertStatus(200);
    }

    /**
     * Teste si l'API peut modifier un tag existant
     *
     * @return void
     */
    public function test_update_tag()
    {
        $admin = User::factory()->admin()->create();
        $tag = Tag::factory()->create();

        $data = [
            'tag_name' => 'test',
            'color' => '#05704',
        ];
        $response = $this->actingAs($admin, 'api')->patchJson("/api/tags/{$tag->id}", $data);
        $response->assertStatus(200);
    }

    /**
     * Teste si l'API peut supprimer un tag existant
     *
     * @return void
     */
    public function test_delete_tag()
    {
        $admin = User::factory()->admin()->create();
        $tag = Tag::factory()->create();

        $response = $this->actingAs($admin, 'api')->delete("/api/tags/{$tag->id}");
        $response->assertStatus(200);
    }
}
