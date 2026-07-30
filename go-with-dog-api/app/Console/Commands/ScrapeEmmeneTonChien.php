<?php

namespace App\Console\Commands;

use App\Models\Address;
use App\Models\Category;
use App\Models\Place;
use App\Models\Tag;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;

/**
 * One-off/rerunnable import: scrapes the public "visite-chien-accepte" listing
 * directory on emmenetonchien.com and inserts matching places into our own
 * `places`/`addresses` table.
 *
 * Deliberately does NOT copy photos (potential copyright issue — the images
 * belong to the listed venues or to emmenetonchien.com, not to us) and does
 * NOT import places outside France (our only geocoder, the BAN API, only
 * covers France, so we'd have no reliable lat/lng for them).
 */
class ScrapeEmmeneTonChien extends Command
{
    protected $signature = 'scrape:emmenetonchien
        {--pages= : Max number of listing pages to crawl (default: all of them)}
        {--limit= : Max number of places to actually import}
        {--delay=1 : Seconds to wait between requests to emmenetonchien.com}
        {--publish : Import with status=publie instead of the default en_attente (pending review)}
        {--dry-run : Parse and report what would be imported, without writing to the database}';

    protected $description = "Import dog-friendly places from emmenetonchien.com's visite-chien-accepte directory";

    private const BASE_URL = 'https://emmenetonchien.com/fiches/visite-chien-accepte/';

    private const USER_AGENT = 'GoWithDogImportBot/1.0 (+https://gowithdog.fr; contact: melissa.mangione@gmail.com)';

    private const BAN_URL = 'https://api-adresse.data.gouv.fr/search/';

    private int $imported = 0;

    private int $skippedForeign = 0;

    private int $skippedGeocode = 0;

    private int $skippedDuplicate = 0;

    private int $skippedError = 0;

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $limit = $this->option('limit') !== null ? (int) $this->option('limit') : null;
        $maxPages = $this->option('pages') !== null ? (int) $this->option('pages') : null;
        $delay = (int) $this->option('delay');

        if ($dryRun) {
            $this->warn('Dry-run: aucune écriture en base ne sera faite.');
        }

        $this->info('Découverte des fiches sur '.self::BASE_URL);
        $urls = $this->collectDetailUrls($maxPages, $delay);
        $this->info(count($urls).' fiche(s) trouvée(s).');

        foreach ($urls as $i => $url) {
            if ($limit !== null && $this->imported >= $limit) {
                $this->info("Limite de {$limit} import(s) atteinte, arrêt.");
                break;
            }

            $this->line(sprintf('[%d/%d] %s', $i + 1, count($urls), $url));

            try {
                $data = $this->scrapeDetailPage($url, $delay);
            } catch (\Throwable $e) {
                $this->warn("  ignoré (erreur: {$e->getMessage()})");
                $this->skippedError++;

                continue;
            }

            if ($data === null) {
                $this->warn('  ignoré (champs requis introuvables sur la page)');
                $this->skippedError++;

                continue;
            }

            if (! $this->isFrance($data['country'])) {
                $this->line("  ignoré (hors France: {$data['country']})");
                $this->skippedForeign++;

                continue;
            }

            if ($data['city'] === null) {
                $this->warn('  ignoré (ville manquante sur la fiche)');
                $this->skippedError++;

                continue;
            }

            if ($this->placeAlreadyExists($data['name'])) {
                $this->line('  ignoré (déjà importé précédemment)');
                $this->skippedDuplicate++;

                continue;
            }

            try {
                $coords = $this->geocode($data['street'], $data['postal_code'], $data['city']);
            } catch (\Throwable $e) {
                $this->warn("  ignoré (erreur de géocodage: {$e->getMessage()})");
                $this->skippedGeocode++;

                continue;
            }
            if ($coords === null) {
                $this->line('  ignoré (adresse non géolocalisable via la BAN)');
                $this->skippedGeocode++;

                continue;
            }

            if ($dryRun) {
                $website = $data['website'] ? " site: {$data['website']}" : '';
                $tags = $data['tags'] ? ' tags: '.implode(', ', $data['tags']) : '';
                $this->line("  -> importerait « {$data['name']} » [{$data['category']}] ({$data['city']}, {$coords['lat']}, {$coords['lng']}){$website}{$tags}");
                $this->imported++;

                continue;
            }

            $address = Address::create([
                'address' => $data['street'],
                'postal_code' => $data['postal_code'],
                'city' => $data['city'],
                'latitude' => $coords['lat'],
                'longitude' => $coords['lng'],
            ]);

            $category = Category::firstOrCreate(['category_name' => $data['category']]);

            $place = Place::create([
                'place_name' => $data['name'],
                'place_description' => $data['description'],
                'place_image' => null,
                'place_website' => $data['website'],
                'user' => null,
                'address' => $address->id,
                'category' => $category->id,
                'status' => $this->option('publish') ? 'publie' : 'en_attente',
            ]);

            if ($data['tags']) {
                $tagIds = array_map(
                    // scope 'place': these amenities only ever come from this
                    // place scraper, never from a ballade one.
                    fn (string $tagName) => Tag::firstOrCreate(
                        ['tag_name' => $tagName],
                        ['color' => $this->randomHexColor(), 'scope' => 'place']
                    )->id,
                    $data['tags']
                );
                $place->tags()->sync($tagIds);
            }

            $this->imported++;
        }

        $this->newLine();
        $this->table(
            ['Importés', 'Doublons ignorés', 'Hors France ignorés', 'Géocodage échoué', 'Erreurs'],
            [[$this->imported, $this->skippedDuplicate, $this->skippedForeign, $this->skippedGeocode, $this->skippedError]]
        );

        return self::SUCCESS;
    }

    /**
     * @return list<string>
     */
    private function collectDetailUrls(?int $maxPages, int $delay): array
    {
        $firstPageHtml = $this->fetchHtml(self::BASE_URL, $delay);
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
            $html = $this->fetchHtml(self::BASE_URL."page/{$page}/", $delay);
            $this->extractDetailUrlsFromPage(new Crawler($html), $urls);
        }

        return array_values(array_unique($urls));
    }

    /**
     * @param  array<int, string>  $urls
     */
    private function extractDetailUrlsFromPage(Crawler $crawler, array &$urls): void
    {
        $crawler->filter('a[href^="'.self::BASE_URL.'"]')->each(function (Crawler $node) use (&$urls) {
            $href = (string) $node->attr('href');
            if ($href === self::BASE_URL || str_contains($href, '/page/')) {
                return;
            }
            $urls[] = $href;
        });
    }

    /**
     * @return array{name: string, description: string, street: string, postal_code: string, city: ?string, country: string, website: ?string, category: string, tags: list<string>}|null
     */
    private function scrapeDetailPage(string $url, int $delay): ?array
    {
        $html = $this->fetchHtml($url, $delay);
        $crawler = new Crawler($html);

        $name = $crawler->filter('h1.title')->count() > 0
            ? trim($crawler->filter('h1.title')->first()->text())
            : null;

        $category = $crawler->filter('.cat-name')->count() > 0
            ? trim($crawler->filter('.cat-name')->first()->text())
            : null;

        $street = $this->firstItempropText($crawler, 'streetAddress');
        $postalCode = $this->firstItempropText($crawler, 'postalCode');
        // addressLocality (city) is absent on some foreign (Belgian) listings —
        // kept optional here so those are reported as "hors France", not a
        // generic parsing error; France listings always carry it.
        $city = $this->firstItempropText($crawler, 'addressLocality');
        $country = $this->firstItempropText($crawler, 'addressCountry');
        $website = $this->firstItempropText($crawler, 'url');

        if (! $name || ! $street || ! $postalCode || ! $country || ! $category) {
            return null;
        }

        if ($website !== null && ! filter_var($website, FILTER_VALIDATE_URL)) {
            $website = null;
        }

        $descriptionParagraphs = $crawler->filter('.listing-description p')
            ->each(fn (Crawler $p) => trim($p->text()));
        $description = trim(preg_replace('/\s+/', ' ', implode(' ', array_filter($descriptionParagraphs))));
        if ($description === '') {
            $description = $name;
        }

        // Each amenity ("Les critères Qualidog", "Autres services sur place", …)
        // becomes one of our tags.
        $tags = $crawler->filter('.amenities-list.clearfix .name')
            ->each(fn (Crawler $n) => trim($n->text()));
        $tags = array_values(array_unique(array_filter($tags, fn (string $t) => $t !== '')));

        return [
            'name' => $name,
            'description' => $description,
            'street' => $street,
            'postal_code' => $postalCode,
            'city' => $city,
            'country' => $country,
            'website' => $website,
            'category' => $category,
            'tags' => $tags,
        ];
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

    private function placeAlreadyExists(string $name): bool
    {
        return Place::whereRaw('LOWER(place_name) = ?', [mb_strtolower(trim($name))])->exists();
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
