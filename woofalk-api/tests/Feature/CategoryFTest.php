<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CategoryFTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_can_create_a_new_category()
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->postJson('/api/categories', ['category_name' => 'New Category']);

        $response->assertStatus(200);
        $this->assertDatabaseHas('categories', ['category_name' => 'New Category']);
    }
}
