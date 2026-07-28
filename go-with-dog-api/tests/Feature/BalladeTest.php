<?php


namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\Ballade;

class BalladeTest extends TestCase
{
    //use RefreshDatabase; // Réinitialise la base de données à chaque test
    /**
     * A basic feature test example.
     *
     * @return void
     */
    /**
     * Teste si la page de la liste des tags est accessible
     *
     * @return void
     */
    public function testIndex(): void
    {
        $response = $this->get('/api/ballades');

        $response->assertStatus(200);

    }

    /**
     * Teste si l'API peut créer une ballades
     *
     * @return void
     */
    public function testCreateBallade(): void
    {
        $data = [
            'ballade_name' => "test1",
            'distance'=> "150",
            'denivele' => "1000",
            'ballade_description' => 'lorem ipsum',
            'ballade_image' => "pas d'image",
            'ballade_latitude' => '44.02',
            'ballade_longitude' => "-10.25",
            'user' => 1,
            'tags' => [2]
        ];

        $response = $this->postJson('/api/ballades', $data);

        $response->assertStatus(200);
    }

    /**
     * Teste si l'API peut modifier une ballades existant
     *
     * @return void
     */
    public function testUpdateBallade()
    {
        $balllade = Ballade::factory()->create();
        $data = [
            'ballade_name' => "tes88t51",
            'distance'=> "150",
            'denivele' => "1000",
            'ballade_description' => 'lorem ipsum',
            'ballade_image' => "pas d'image",
            'ballade_latitude' => '44.02',
            'ballade_longitude' => "-10.25",
            'user' => 1,
            'tags' => [2]
        ];
        $response = $this->putJson("/api/ballades/{$balllade->id}", $data);
        $response->assertStatus(200);

    }

    /**
     * Teste si l'API peut supprimer une ballade existant
     *
     * @return void
     */
    public function testDeleteBallade()
    {
        $ballade = Ballade::factory()->create();

        $response = $this->delete("/api/ballades/{$ballade->id}");
        $response->assertStatus(204);
    }


}
