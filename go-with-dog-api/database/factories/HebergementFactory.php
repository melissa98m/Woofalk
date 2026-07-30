<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\Category;
use App\Models\Hebergement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Hebergement>
 */
class HebergementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'hebergement_name' => fake()->company(),
            'hebergement_description' => fake()->paragraph(),
            'hebergement_image' => null,
            'price_indication' => fake()->randomElement(['20€/jour', '25€/nuit', '15€/séjour', null]),
            'user' => User::factory(),
            'address' => Address::factory(),
            'category' => Category::factory(),
            'status' => fake()->randomElement(['publie', 'en_attente']),
        ];
    }
}
