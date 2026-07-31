<?php

use App\Models\Address;
use App\Models\Category;
use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PlaceTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_belongs_to_a_user()
    {
        $user = User::factory()->create();
        $place = Place::factory()->create(['user' => $user->id]);

        // The "user" column holds the raw FK id, so $place->user returns that
        // id, not the related model — call the relation method instead.
        $this->assertInstanceOf(User::class, $place->user()->first());
        $this->assertEquals($user->id, $place->user()->first()->id);
    }

    #[Test]
    public function it_belongs_to_an_address()
    {
        $address = Address::factory()->create();
        $place = Place::factory()->create(['address' => $address->id]);

        $this->assertInstanceOf(Address::class, $place->address()->first());
        $this->assertEquals($address->id, $place->address()->first()->id);
    }

    #[Test]
    public function it_belongs_to_a_category()
    {
        $category = Category::factory()->create();
        $place = Place::factory()->create(['category' => $category->id]);

        $this->assertInstanceOf(Category::class, $place->category()->first());
        $this->assertEquals($category->id, $place->category()->first()->id);
    }
}
