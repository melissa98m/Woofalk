<?php

namespace Tests\Feature;

use App\Models\Ballade;
use App\Models\Hebergement;
use App\Models\Place;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class SitemapTest extends TestCase
{
    use DatabaseTransactions;

    public function test_sitemap_is_valid_xml(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/xml');
    }

    public function test_sitemap_lists_static_pages(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertSee(config('app.frontend_url').'/places', false);
        $response->assertSee(config('app.frontend_url').'/ballades', false);
        $response->assertSee(config('app.frontend_url').'/hebergements', false);
    }

    public function test_sitemap_lists_published_place_but_not_pending_one(): void
    {
        $published = Place::factory()->create(['status' => 'publie']);
        $pending = Place::factory()->create(['status' => 'en_attente']);

        $response = $this->get('/sitemap.xml');

        $response->assertSee(config('app.frontend_url')."/places/{$published->id}", false);
        $response->assertDontSee(config('app.frontend_url')."/places/{$pending->id}", false);
    }

    public function test_sitemap_lists_published_ballade_and_hebergement(): void
    {
        $ballade = Ballade::factory()->create(['status' => 'publie']);
        $hebergement = Hebergement::factory()->create(['status' => 'publie']);

        $response = $this->get('/sitemap.xml');

        $response->assertSee(config('app.frontend_url')."/ballades/{$ballade->id}", false);
        $response->assertSee(config('app.frontend_url')."/hebergements/{$hebergement->id}", false);
    }
}
