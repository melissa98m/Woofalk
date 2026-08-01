<?php

namespace App\Http\Controllers;

use App\Models\Ballade;
use App\Models\Hebergement;
use App\Models\Place;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    // Public, non-authenticated front-end routes worth indexing (see the SEO
    // guidance in CLAUDE.md) — auth/account/admin routes are excluded here
    // and blocked in robots.txt instead.
    private const STATIC_PATHS = [
        '' => ['changefreq' => 'daily', 'priority' => '1.0'],
        'places' => ['changefreq' => 'daily', 'priority' => '0.8'],
        'ballades' => ['changefreq' => 'daily', 'priority' => '0.8'],
        'hebergements' => ['changefreq' => 'daily', 'priority' => '0.8'],
        'contact' => ['changefreq' => 'monthly', 'priority' => '0.3'],
        'faq' => ['changefreq' => 'monthly', 'priority' => '0.3'],
        'mentions-legales' => ['changefreq' => 'yearly', 'priority' => '0.1'],
        'politique-confidentialite' => ['changefreq' => 'yearly', 'priority' => '0.1'],
    ];

    /**
     * Generate the sitemap from live data rather than a static file, so newly
     * published places/ballades/hebergements are indexable without a deploy.
     * Served at the API's own /sitemap.xml (see routes/web.php) and proxied
     * to the front-end's domain by a Vercel rewrite so it appears at the
     * same origin as the URLs it lists.
     */
    public function index(): Response
    {
        $siteUrl = rtrim(config('app.frontend_url'), '/');
        $today = now()->toDateString();

        $urls = [];

        foreach (self::STATIC_PATHS as $path => $meta) {
            $urls[] = [
                'loc' => $path === '' ? "{$siteUrl}/" : "{$siteUrl}/{$path}",
                'lastmod' => $today,
                'changefreq' => $meta['changefreq'],
                'priority' => $meta['priority'],
            ];
        }

        $resources = [
            'places' => Place::class,
            'ballades' => Ballade::class,
            'hebergements' => Hebergement::class,
        ];

        // Only 'publie' records are indexed — unmoderated/'en_attente' content
        // shouldn't be offered to crawlers.
        foreach ($resources as $path => $model) {
            $model::query()
                ->where('status', 'publie')
                ->select(['id', 'updated_at'])
                ->orderBy('id')
                ->each(function ($record) use (&$urls, $siteUrl, $path) {
                    $urls[] = [
                        'loc' => "{$siteUrl}/{$path}/{$record->id}",
                        'lastmod' => $record->updated_at->toDateString(),
                        'changefreq' => 'weekly',
                        'priority' => '0.6',
                    ];
                });
        }

        $xml = view('sitemap', ['urls' => $urls])->render();

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }
}
