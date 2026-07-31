<?php

use App\Models\Category;
use App\Models\Place;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_has_many_places()
    {
        $category = Category::factory()->create();
        $place1 = Place::factory()->create(['category' => $category->id]);
        $place2 = Place::factory()->create(['category' => $category->id]);

        $places = $category->places();

        $this->assertInstanceOf('Illuminate\Database\Eloquent\Relations\HasMany', $places);
        $this->assertEquals(2, $places->count());
        $this->assertTrue($places->get()->contains($place1));
        $this->assertTrue($places->get()->contains($place2));
    }
}
