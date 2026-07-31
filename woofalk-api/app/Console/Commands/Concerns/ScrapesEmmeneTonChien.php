<?php

namespace App\Console\Commands\Concerns;

use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;

/**
 * Shared HTTP/parsing/geocoding plumbing for the emmenetonchien.com scraper
 * commands (places, ballades, …) — each fiche type has its own listing path
 * and field mapping, but discovery pagination, request politeness/retries,
 * itemprop reading, and BAN geocoding are identical.
 */
trait ScrapesEmmeneTonChien
{
    private const USER_AGENT = 'WoofalkImportBot/1.0 (+https://woofalk.fr; contact: melissa.mangione@gmail.com)';

    private const BAN_URL = 'https://api-adresse.data.gouv.fr/search/';

    abstract protected function baseUrl(): string;

    /**
     * @return list<string>
     */
    private function collectDetailUrls(?int $maxPages, int $delay): array
    {
        $firstPageHtml = $this->fetchHtml($this->baseUrl(), $delay);
        $crawler = new Crawler($firstPageHtml);

        $lastPage = 1;
        $crawler->filter('a[href*="/page/"]')->each(function (Crawler $node) use (&$lastPage) {
            if (preg_match('#/page/(\d+)/#', (string) $node->attr('href'), $m)) {
                $lastPage = max($lastPage, (int) $m[1]);
            }
        });
        if ($maxPages !== null) {
            $lastPage = min($lastPage, $maxPages);
        }
        $this->info("{$lastPage} page(s) de listing à parcourir.");

        $urls = [];
        $this->extractDetailUrlsFromPage($crawler, $urls);

        for ($page = 2; $page <= $lastPage; $page++) {
            $html = $this->fetchHtml($this->baseUrl()."page/{$page}/", $delay);
            $this->extractDetailUrlsFromPage(new Crawler($html), $urls);
        }

        return array_values(array_unique($urls));
    }

    /**
     * @param  array<int, string>  $urls
     */
    private function extractDetailUrlsFromPage(Crawler $crawler, array &$urls): void
    {
        $crawler->filter('a[href^="'.$this->baseUrl().'"]')->each(function (Crawler $node) use (&$urls) {
            $href = (string) $node->attr('href');
            if ($href === $this->baseUrl() || str_contains($href, '/page/')) {
                return;
            }
            $urls[] = $href;
        });
    }

    private function firstItempropText(Crawler $crawler, string $itemprop): ?string
    {
        $node = $crawler->filter('[itemprop="'.$itemprop.'"]');

        return $node->count() > 0 ? trim($node->first()->text()) : null;
    }

    private function randomHexColor(): string
    {
        return sprintf('#%06X', random_int(0, 0xFFFFFF));
    }

    private function isFrance(string $country): bool
    {
        return mb_strtolower(trim($country)) === 'france';
    }

    /**
     * @return array{lat: float, lng: float}|null
     */
    private function geocode(string $street, string $postalCode, string $city): ?array
    {
        $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
            ->timeout(15)
            ->retry(3, 1000)
            ->get(self::BAN_URL, [
                'q' => trim("{$street} {$postalCode} {$city}"),
                'limit' => 1,
            ]);

        if (! $response->successful()) {
            return null;
        }

        $features = $response->json('features', []);
        if (empty($features)) {
            return null;
        }

        $coordinates = $features[0]['geometry']['coordinates'] ?? null;
        if (! is_array($coordinates) || count($coordinates) < 2) {
            return null;
        }

        return ['lat' => (float) $coordinates[1], 'lng' => (float) $coordinates[0]];
    }

    /**
     * Some fiche types (e.g. beaches) don't carry a street address to geocode
     * via the BAN API, but the theme's per-listing map widget embeds the
     * fiche's own lat/lng in an inline `ziston_map_options` JS object —
     * read that directly instead. More accurate than geocoding a
     * postcode+city anyway, since that would only resolve to the town
     * centre rather than the actual spot.
     *
     * @return array{lat: float, lng: float}|null
     */
    private function extractInlineMapCoordinates(string $html): ?array
    {
        if (! preg_match('/ziston_map_options\s*=\s*(\{.*?\});/s', $html, $m)) {
            return null;
        }

        $options = json_decode($m[1], true);
        if (! is_array($options) || ! isset($options['latitude'], $options['longitude'])) {
            return null;
        }

        $lat = (float) $options['latitude'];
        $lng = (float) $options['longitude'];

        if ($lat === 0.0 && $lng === 0.0) {
            return null;
        }

        return ['lat' => $lat, 'lng' => $lng];
    }

    private function fetchHtml(string $url, int $delay): string
    {
        $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
            ->timeout(20)
            ->retry(3, 1000)
            ->get($url);

        if ($delay > 0) {
            sleep($delay);
        }

        if (! $response->successful()) {
            throw new \RuntimeException("HTTP {$response->status()} pour {$url}");
        }

        return $response->body();
    }
}
