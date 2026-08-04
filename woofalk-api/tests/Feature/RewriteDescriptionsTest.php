<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Ballade;
use App\Models\Category;
use App\Models\Hebergement;
use App\Models\Place;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RewriteDescriptionsTest extends TestCase
{
    use DatabaseTransactions;

    private function unique(string $label): string
    {
        return $label.' '.bin2hex(random_bytes(4));
    }

    private function fakeAnthropicResponse(string $text): void
    {
        Http::fake([
            'api.anthropic.com/*' => Http::response([
                'content' => [['type' => 'text', 'text' => $text]],
            ], 200),
        ]);
    }

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.anthropic.key' => 'test-key']);
    }

    private function makePlace(string $description): Place
    {
        $address = Address::create([
            'address' => $this->unique('1 rue du Chien'),
            'postal_code' => '75000',
            'city' => 'Paris',
            'latitude' => 48.85,
            'longitude' => 2.35,
        ]);
        $category = Category::create(['category_name' => $this->unique('Parc'), 'scope' => 'place']);

        return Place::create([
            'place_name' => $this->unique('Le Chien Heureux'),
            'place_description' => $description,
            'address' => $address->id,
            'category' => $category->id,
            'status' => 'publie',
        ]);
    }

    public function test_it_rewrites_a_targeted_place_description_and_stamps_it(): void
    {
        $place = $this->makePlace('Un endroit sympa pour les chiens, scrapé ailleurs.');
        $this->fakeAnthropicResponse('Une adresse conviviale où votre compagnon à quatre pattes est le bienvenu.');

        $this->artisan("descriptions:rewrite places --ids={$place->id} --delay=0")
            ->assertExitCode(0);

        $place->refresh();
        $this->assertSame('Une adresse conviviale où votre compagnon à quatre pattes est le bienvenu.', $place->place_description);
        $this->assertNotNull($place->description_rewritten_at);
    }

    public function test_dry_run_does_not_persist_changes(): void
    {
        $place = $this->makePlace('Description originale.');
        $this->fakeAnthropicResponse('Description reformulée.');

        $this->artisan("descriptions:rewrite places --ids={$place->id} --delay=0 --dry-run")
            ->assertExitCode(0);

        $place->refresh();
        $this->assertSame('Description originale.', $place->place_description);
        $this->assertNull($place->description_rewritten_at);
    }

    public function test_explicit_ids_reprocess_a_record_even_if_already_rewritten(): void
    {
        $place = $this->makePlace('Ancienne reformulation.');
        $place->description_rewritten_at = now()->subDay();
        $place->save();
        $this->fakeAnthropicResponse('Nouvelle reformulation.');

        $this->artisan("descriptions:rewrite places --ids={$place->id} --delay=0")
            ->assertExitCode(0);

        $place->refresh();
        $this->assertSame('Nouvelle reformulation.', $place->place_description);
    }

    public function test_a_failed_api_call_leaves_the_record_unrewritten_for_retry(): void
    {
        $place = $this->makePlace('Description originale.');
        Http::fake(['api.anthropic.com/*' => Http::response([], 500)]);

        $this->artisan("descriptions:rewrite places --ids={$place->id} --delay=0")
            ->assertExitCode(0);

        $place->refresh();
        $this->assertSame('Description originale.', $place->place_description);
        $this->assertNull($place->description_rewritten_at);
    }

    public function test_it_rewrites_ballade_and_hebergement_descriptions_too(): void
    {
        $ballade = Ballade::create([
            'ballade_name' => $this->unique('Boucle du chien'),
            'ballade_description' => 'Une balade scrapée.',
            'ballade_latitude' => 48.85,
            'ballade_longitude' => 2.35,
            'status' => 'publie',
        ]);
        $address = Address::create([
            'address' => $this->unique('2 rue du Chien'),
            'postal_code' => '75000',
            'city' => 'Paris',
            'latitude' => 48.85,
            'longitude' => 2.35,
        ]);
        $category = Category::create(['category_name' => $this->unique('Hôtel'), 'scope' => 'hebergement']);
        $hebergement = Hebergement::create([
            'hebergement_name' => $this->unique('Le Gîte du Chien'),
            'hebergement_description' => 'Un hébergement scrapé.',
            'address' => $address->id,
            'category' => $category->id,
            'status' => 'publie',
        ]);
        $this->fakeAnthropicResponse('Texte reformulé.');

        $this->artisan("descriptions:rewrite ballades --ids={$ballade->id} --delay=0")->assertExitCode(0);
        $this->artisan("descriptions:rewrite hebergements --ids={$hebergement->id} --delay=0")->assertExitCode(0);

        $this->assertSame('Texte reformulé.', $ballade->refresh()->ballade_description);
        $this->assertSame('Texte reformulé.', $hebergement->refresh()->hebergement_description);
    }

    public function test_it_requires_an_api_key(): void
    {
        config(['services.anthropic.key' => null]);
        $place = $this->makePlace('Description originale.');

        $this->artisan("descriptions:rewrite places --ids={$place->id}")
            ->assertExitCode(1);
    }
}
