<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Place>
 */
class PlaceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'place_name' => fake()->company(),
            'place_description' => fake()->paragraph(),
            'place_image' => null,
            'user' => User::factory(),
            'address' => Address::factory(),
            'category' => Category::factory(),
            'status' => fake()->randomElement(['publie', 'en_attente']),
        ];
    }
}
