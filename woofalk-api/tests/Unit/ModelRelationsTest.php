<?php

namespace Tests\Unit;

use App\Models\Address;
use App\Models\Ballade;
use App\Models\Category;
use App\Models\Hebergement;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Collection;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ModelRelationsTest extends TestCase
{
    use DatabaseTransactions;

    public function test_address_relations(): void
    {
        $address = Address::factory()->create();

        $this->assertInstanceOf(Collection::class, $address->places);
        $this->assertInstanceOf(Collection::class, $address->hebergements);
    }

    public function test_category_relations(): void
    {
        $category = Category::factory()->create();

        $this->assertInstanceOf(Collection::class, $category->places);
        $this->assertInstanceOf(Collection::class, $category->hebergements);
    }

    public function test_user_hebergements_relation(): void
    {
        $user = User::factory()->create();
        Hebergement::factory()->create(['user' => $user->id]);

        $this->assertCount(1, $user->hebergements);
    }

    #[DataProvider('difficultyAndLengthProvider')]
    public function test_ballade_difficulty_and_length_tag_names(?float $distance, ?int $denivele, array $expected): void
    {
        $this->assertSame($expected, Ballade::difficultyAndLengthTagNames($distance, $denivele));
    }

    public static function difficultyAndLengthProvider(): array
    {
        return [
            'facile and court' => [5.0, 200, ['Facile', 'Court']],
            'moyen and long' => [15.0, 800, ['Moyen', 'Long']],
            'difficile only' => [null, 1500, ['Difficile']],
            'court only' => [5.0, null, ['Court']],
            'nothing known' => [null, null, []],
        ];
    }
}
