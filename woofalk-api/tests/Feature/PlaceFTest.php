<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Category;
use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PlaceFTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_can_create_a_new_place()
    {
        // The controller stores uploads via the default ("local") disk, not
        // the "public" disk, even though the path happens to land under
        // storage/app/public — fake the disk it actually writes to.
        Storage::fake('local');

        $user = User::factory()->create();
        $address = Address::factory()->create();
        $category = Category::factory()->create();

        $image = UploadedFile::fake()->image('place.jpg');
        $data = [
            'place_name' => 'New Place',
            'place_description' => 'This is a new place',
            'place_image' => $image,
            'address' => $address->id,
            'category' => $category->id,
        ];

        $response = $this->actingAs($user, 'api')->post('/api/places', $data);

        $response->assertStatus(200);
        $this->assertDatabaseHas('places', ['place_name' => 'New Place']);

        $place = Place::where('place_name', 'New Place')->firstOrFail();
        Storage::disk('local')->assertExists('public/uploads/places/'.$place->place_image);
    }
}
