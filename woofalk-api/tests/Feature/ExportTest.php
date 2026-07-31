<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ExportTest extends TestCase
{
    use DatabaseTransactions;

    public function test_guest_cannot_access_export_options(): void
    {
        $response = $this->getJson('/api/export/options');

        $response->assertStatus(401);
    }

    public function test_regular_user_cannot_access_export(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson('/api/export/options');

        $response->assertStatus(403);
    }

    public function test_admin_can_list_export_options(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/export/options');

        $response->assertStatus(200);
        $response->assertJsonFragment(['key' => 'places']);
        $response->assertJsonMissing(['key' => 'password']);
    }

    public function test_admin_can_export_a_single_table_as_csv(): void
    {
        $admin = User::factory()->admin()->create();
        Category::create(['category_name' => 'Parc']);

        $response = $this->actingAs($admin, 'api')->postJson('/api/export/csv', [
            'tables' => ['categories' => ['id', 'category_name']],
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Parc', $response->getContent());
    }

    public function test_admin_can_export_several_tables_as_zip(): void
    {
        $admin = User::factory()->admin()->create();
        Category::create(['category_name' => 'Parc']);

        $response = $this->actingAs($admin, 'api')->postJson('/api/export/csv', [
            'tables' => [
                'categories' => ['id', 'category_name'],
                'tags' => ['id', 'tag_name'],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/zip');
    }

    public function test_csv_export_rejects_an_unknown_table(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->postJson('/api/export/csv', [
            'tables' => ['users_secret' => ['id']],
        ]);

        $response->assertStatus(422);
    }

    public function test_csv_export_never_exposes_user_password_column(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->postJson('/api/export/csv', [
            'tables' => ['users' => ['id', 'username', 'email', 'password', 'remember_token']],
        ]);

        $response->assertStatus(200);
        $header = strtok($response->getContent(), "\n");
        $this->assertStringNotContainsString('password', $header);
        $this->assertStringNotContainsString('remember_token', $header);
    }

    public function test_regular_user_cannot_export_sql_dump(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson('/api/export/sql');

        $response->assertStatus(403);
    }

    public function test_admin_can_download_sql_dump(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->get('/api/export/sql');

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/zip');
    }
}
