<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Ballade;
use App\Models\Category;
use App\Models\Place;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        if (! User::where('email', 'admin@gowithdog.fr')->exists()) {
            User::factory()->admin()->create([
                'username' => 'admin',
                'email' => 'admin@gowithdog.fr',
            ]);
        }

        if (Category::count() > 0) {
            return;
        }

        $users = User::factory(5)->create();
        $categories = Category::factory(5)->create();
        $tags = Tag::factory(5)->create();
        Address::factory(10)->create();

        $places = Place::factory(15)->create([
            'user' => fn () => $users->random()->id,
            'address' => fn () => Address::inRandomOrder()->first()->id,
            'category' => fn () => $categories->random()->id,
        ]);
        $places->each(fn ($place) => $place->tags()->attach($tags->random(rand(1, 3))->pluck('id')));

        $ballades = Ballade::factory(15)->create([
            'user' => fn () => $users->random()->id,
        ]);
        $ballades->each(fn ($ballade) => $ballade->tags()->attach($tags->random(rand(1, 3))->pluck('id')));
    }
}
