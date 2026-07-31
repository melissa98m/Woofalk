<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ballade>
 */
class BalladeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'ballade_name' => fake()->sentence(3),
            'distance' => fake()->numberBetween(1, 50),
            'denivele' => fake()->numberBetween(0, 2000),
            'ballade_description' => fake()->paragraph(),
            'ballade_image' => null,
            'ballade_latitude' => fake()->latitude(41, 51),
            'ballade_longitude' => fake()->longitude(-5, 9),
            'user' => User::factory(),
            'status' => fake()->randomElement(['publie', 'en_attente']),
        ];
    }
}
