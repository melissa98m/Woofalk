<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Place;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ImportTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * The DB in this environment isn't reset between test runs (it's real
     * dev data, only rolled back per-test by DatabaseTransactions), so every
     * row this suite writes must be uniquely named to avoid colliding with
     * (or accidentally matching/updating) pre-existing data.
     */
    private function unique(string $label): string
    {
        return $label.' '.bin2hex(random_bytes(4));
    }

    private function csvFile(string $filename, array $header, array $rows): UploadedFile
    {
        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, $header);
        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }
        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return UploadedFile::fake()->createWithContent($filename, $content);
    }

    private function import(User $admin, string $endpoint, string $table, UploadedFile $file)
    {
        return $this->actingAs($admin, 'api')
            ->post("/api/import/{$endpoint}", ['table' => $table, 'file' => $file], ['Accept' => 'application/json']);
    }

    private function placesHeader(): array
    {
        return ['place_name', 'place_description', 'place_website', 'status', 'address', 'postal_code', 'city', 'latitude', 'longitude', 'category_name', 'tags'];
    }

    private function samplePlaceRow(array $overrides = []): array
    {
        $row = [
            'place_name' => $overrides['place_name'] ?? $this->unique('Le Chien Heureux'),
            'place_description' => 'Un super endroit',
            'place_website' => '',
            'status' => '',
            'address' => $overrides['address'] ?? $this->unique('1 rue du Chien'),
            'postal_code' => '75000',
            'city' => 'Paris',
            'latitude' => '48.85',
            'longitude' => '2.35',
            'category_name' => $overrides['category_name'] ?? $this->unique('Parc'),
            'tags' => '',
        ];

        return array_values(array_merge($row, $overrides));
    }

    public function test_guest_cannot_access_import_endpoints(): void
    {
        $this->getJson('/api/import/options')->assertStatus(401);
        $this->postJson('/api/import/preview', [])->assertStatus(401);
        $this->postJson('/api/import/commit', [])->assertStatus(401);
    }

    public function test_regular_user_cannot_access_import_endpoints(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'api')->getJson('/api/import/options')->assertStatus(403);
        $this->actingAs($user, 'api')->postJson('/api/import/preview', [])->assertStatus(403);
    }

    public function test_admin_can_list_import_options(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/import/options');

        $response->assertStatus(200);
        $response->assertJsonFragment(['key' => 'places']);
        $response->assertJsonMissing(['key' => 'users']);
        $response->assertJsonMissing(['key' => 'contacts']);
    }

    public function test_preview_reports_creation_without_writing_to_database(): void
    {
        $admin = User::factory()->admin()->create();
        $name = $this->unique('Le Chien Heureux');
        $file = $this->csvFile('places.csv', $this->placesHeader(), [$this->samplePlaceRow(['place_name' => $name])]);

        $response = $this->import($admin, 'preview', 'places', $file);

        $response->assertStatus(200);
        $response->assertJsonPath('summary.toCreate', 1);
        $response->assertJsonPath('summary.errors', 0);
        $this->assertSame(0, Place::whereRaw('LOWER(place_name) = ?', [mb_strtolower($name)])->count());
    }

    public function test_commit_creates_place_address_and_category(): void
    {
        $admin = User::factory()->admin()->create();
        $name = $this->unique('Le Chien Heureux');
        $file = $this->csvFile('places.csv', $this->placesHeader(), [$this->samplePlaceRow(['place_name' => $name])]);

        $response = $this->import($admin, 'commit', 'places', $file);

        $response->assertStatus(200);
        $response->assertJsonPath('summary.toCreate', 1);

        $place = Place::whereRaw('LOWER(place_name) = ?', [mb_strtolower($name)])->first();
        $this->assertNotNull($place);
        $this->assertSame($admin->id, $place->user);
        $this->assertNotNull($place->address()->first());
        $this->assertNotNull($place->category()->first());
    }

    public function test_import_never_lets_the_csv_set_place_ownership(): void
    {
        $admin = User::factory()->admin()->create();
        $otherUser = User::factory()->create();
        $name = $this->unique('Le Chien Heureux');

        // 'user' isn't in the whitelisted places header at all, but even if
        // a crafted CSV smuggled a `user` column in, it must never reach
        // Model::create() — ownership is always the importing admin.
        $header = array_merge($this->placesHeader(), ['user']);
        $row = array_merge($this->samplePlaceRow(['place_name' => $name]), [(string) $otherUser->id]);
        $file = $this->csvFile('places.csv', $header, [$row]);

        $this->import($admin, 'commit', 'places', $file)->assertStatus(200);

        $place = Place::whereRaw('LOWER(place_name) = ?', [mb_strtolower($name)])->first();
        $this->assertSame($admin->id, $place->user);
        $this->assertNotSame($otherUser->id, $place->user);
    }

    public function test_reimporting_the_same_name_and_address_updates_instead_of_duplicating(): void
    {
        $admin = User::factory()->admin()->create();
        $name = $this->unique('Le Chien Heureux');
        $address = $this->unique('1 rue du Chien');

        $firstRow = $this->samplePlaceRow(['place_name' => $name, 'address' => $address]);
        $this->import($admin, 'commit', 'places', $this->csvFile('places.csv', $this->placesHeader(), [$firstRow]))
            ->assertStatus(200);
        $this->assertSame(1, Place::whereRaw('LOWER(place_name) = ?', [mb_strtolower($name)])->count());

        $secondRow = $this->samplePlaceRow(['place_name' => $name, 'address' => $address, 'place_description' => 'Description mise à jour']);
        $response = $this->import($admin, 'commit', 'places', $this->csvFile('places.csv', $this->placesHeader(), [$secondRow]));

        $response->assertStatus(200);
        $response->assertJsonPath('summary.toUpdate', 1);
        $this->assertSame(1, Place::whereRaw('LOWER(place_name) = ?', [mb_strtolower($name)])->count());
        $this->assertSame('Description mise à jour', Place::whereRaw('LOWER(place_name) = ?', [mb_strtolower($name)])->first()->place_description);
    }

    public function test_reimporting_identical_data_reports_unchanged(): void
    {
        $admin = User::factory()->admin()->create();
        $row = $this->samplePlaceRow();

        $this->import($admin, 'commit', 'places', $this->csvFile('places.csv', $this->placesHeader(), [$row]))
            ->assertStatus(200);

        $response = $this->import($admin, 'preview', 'places', $this->csvFile('places.csv', $this->placesHeader(), [$row]));

        $response->assertStatus(200);
        $response->assertJsonPath('summary.unchanged', 1);
        $response->assertJsonPath('summary.toUpdate', 0);
    }

    public function test_import_rejects_an_unknown_table(): void
    {
        $admin = User::factory()->admin()->create();
        $file = $this->csvFile('x.csv', ['a'], [['1']]);

        $this->import($admin, 'preview', 'users_secret', $file)->assertStatus(422);
    }

    public function test_import_rejects_a_file_missing_a_required_column(): void
    {
        $admin = User::factory()->admin()->create();
        $file = $this->csvFile('categories.csv', ['scope'], [['place']]);

        $this->import($admin, 'preview', 'categories', $file)->assertStatus(422);
    }

    public function test_import_rejects_an_oversized_file(): void
    {
        $admin = User::factory()->admin()->create();
        $file = UploadedFile::fake()->create('big.csv', 6000, 'text/csv');

        $this->import($admin, 'preview', 'categories', $file)->assertStatus(422);
    }

    public function test_import_rejects_a_non_csv_file(): void
    {
        $admin = User::factory()->admin()->create();
        $file = UploadedFile::fake()->create('malware.exe', 10, 'application/x-msdownload');

        $this->import($admin, 'preview', 'categories', $file)->assertStatus(422);
    }

    public function test_import_rejects_a_file_exceeding_the_row_limit(): void
    {
        $admin = User::factory()->admin()->create();
        $rows = array_fill(0, 2001, ['Adresse test', '75000', 'Paris', '48.85', '2.35']);
        $file = $this->csvFile('addresses.csv', ['address', 'postal_code', 'city', 'latitude', 'longitude'], $rows);

        $this->import($admin, 'preview', 'addresses', $file)->assertStatus(422);
    }

    public function test_valid_and_malformed_rows_in_the_same_file_are_processed_independently(): void
    {
        $admin = User::factory()->admin()->create();
        $rows = [
            $this->samplePlaceRow(),
            $this->samplePlaceRow(['place_name' => $this->unique('Adresse invalide'), 'latitude' => '999']),
        ];
        $file = $this->csvFile('places.csv', $this->placesHeader(), $rows);

        $response = $this->import($admin, 'preview', 'places', $file);

        $response->assertStatus(200);
        $response->assertJsonPath('summary.toCreate', 1);
        $response->assertJsonPath('summary.errors', 1);
    }

    public function test_category_matching_is_case_insensitive(): void
    {
        $admin = User::factory()->admin()->create();
        $categoryName = $this->unique('Hôtel');
        Category::create(['category_name' => $categoryName, 'scope' => 'place']);

        $file = $this->csvFile('places.csv', $this->placesHeader(), [
            $this->samplePlaceRow(['category_name' => mb_strtoupper($categoryName)]),
        ]);

        $this->import($admin, 'commit', 'places', $file)->assertStatus(200);

        $this->assertSame(1, Category::whereRaw('LOWER(category_name) = ?', [mb_strtolower($categoryName)])->count());
    }

    public function test_tags_column_creates_and_attaches_scoped_tags(): void
    {
        $admin = User::factory()->admin()->create();
        $tagA = $this->unique('calme');
        $tagB = $this->unique('terrasse');
        $file = $this->csvFile('places.csv', $this->placesHeader(), [
            $this->samplePlaceRow(['tags' => "{$tagA};{$tagB}"]),
        ]);

        $this->import($admin, 'commit', 'places', $file)->assertStatus(200);

        $tag = Tag::whereRaw('LOWER(tag_name) = ?', [mb_strtolower($tagA)])->first();
        $this->assertNotNull($tag);
        $this->assertSame('place', $tag->scope);
        $this->assertSame(2, Tag::whereIn('tag_name', [$tagA, $tagB])->count());
    }
}
