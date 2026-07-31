<?php

namespace App\Console\Commands;

use App\Models\Address;
use App\Models\Category;
use App\Models\Place;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * One-off/rerunnable import: reads the public WP REST API of wawaf.fr's
 * "restaurants-chien" listing (category id 5, ~6 800 fiches at time of
 * writing) and inserts matching restaurants into our own `places`/
 * `addresses` tables.
 *
 * Unlike the emmenetonchien.com scrapers (see Concerns\ScrapesEmmeneTonChien),
 * this reads structured JSON straight from wawaf's `wp-json/wp/v2/etablissement`
 * endpoint instead of parsing HTML, and each fiche already carries its own
 * lat/lng (`meta_box.latitude_hotel`/`longitude_hotel`) — sourced from
 * TripAdvisor, per `meta_box.id_hotel`/`url_hotel` — so no BAN geocoding
 * step is needed here.
 *
 * The listing data is thin: `meta_box.description_hotel` is almost always
 * just the département name (e.g. "Essonne") rather than a real
 * description, and `meta_box.url_hotel` is almost always a tripadvisor.fr
 * review link rather than the restaurant's own site. The description is
 * filtered out below (falls back to the restaurant's own name) since a bare
 * département name would be misleading as "the" description; the
 * TripAdvisor link is kept as `place_website` since it's still a genuine,
 * useful link (photos, reviews, hours) even when it isn't the venue's own
 * domain.
 *
 * Also: national chains (Courtepaille, …) are listed once per branch under
 * the exact same name, so duplicate detection here matches on name + city
 * (not name alone like the emmenetonchien scrapers) to avoid treating every
 * branch after the first as an already-imported duplicate.
 *
 * Deliberately does NOT copy photos (potential copyright issue — the images
 * belong to the listed venues, TripAdvisor, or wawaf.fr, not to us).
 */
class ScrapeWawafRestaurant extends Command
{
    private const USER_AGENT = 'WoofalkImportBot/1.0 (+https://woofalk.fr; contact: melissa.mangione@gmail.com)';

    private const API_URL = 'https://wawaf.fr/wp-json/wp/v2/etablissement';

    private const RESTAURANT_CATEGORY_ID = 5;

    private const PER_PAGE = 100;

    protected $signature = 'scrape:wawaf-restaurant
        {--pages= : Max number of API pages to crawl, 100 fiches/page (default: all of them, ~68 pages)}
        {--limit= : Max number of places to actually import}
        {--delay=1 : Seconds to wait between requests to wawaf.fr}
        {--publish : Import with status=publie instead of the default en_attente (pending review)}
        {--dry-run : Parse and report what would be imported, without writing to the database}';

    protected $description = "Import dog-friendly restaurants from wawaf.fr's restaurants-chien directory "
        .'(~6 800 fiches across ~68 API pages — use --pages/--limit for a first, smaller run)';

    private int $imported = 0;

    private int $skippedDuplicate = 0;

    private int $skippedForeign = 0;

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

        $page = 1;
        $lastPage = 1;
        $totalFetched = 0;

        do {
            if ($limit !== null && $this->imported >= $limit) {
                $this->info("Limite de {$limit} import(s) atteinte, arrêt.");
                break;
            }

            try {
                [$items, $lastPage, $total] = $this->fetchPage($page);
            } catch (\Throwable $e) {
                $this->warn("Page {$page} ignorée (erreur: {$e->getMessage()})");
                $this->skippedError++;
                $page++;

                continue;
            }

            if ($maxPages !== null) {
                $lastPage = min($lastPage, $maxPages);
            }

            if ($page === 1) {
                $this->info("{$lastPage} page(s) API à parcourir ({$total} fiche(s) au total sur wawaf.fr).");
            }

            foreach ($items as $item) {
                $totalFetched++;

                if ($limit !== null && $this->imported >= $limit) {
                    break;
                }

                $data = $this->extractData($item);
                if ($data === null) {
                    $this->warn("  [{$totalFetched}] ignoré (champs requis introuvables)");
                    $this->skippedError++;

                    continue;
                }

                $this->line(sprintf('[%d] %s (%s)', $totalFetched, $data['name'], $data['city']));

                if (! $this->isFrance($data['raw_address'])) {
                    $this->line("  ignoré (hors France: {$data['raw_address']})");
                    $this->skippedForeign++;

                    continue;
                }

                if ($this->placeAlreadyExists($data['name'], $data['city'])) {
                    $this->line('  ignoré (déjà importé précédemment)');
                    $this->skippedDuplicate++;

                    continue;
                }

                if ($dryRun) {
                    $website = $data['website'] ? " site: {$data['website']}" : '';
                    $this->line("  -> importerait « {$data['name']} » ({$data['city']}, {$data['lat']}, {$data['lng']}){$website}");
                    $this->imported++;

                    continue;
                }

                $address = Address::create([
                    'address' => $data['street'],
                    'postal_code' => $data['postal_code'],
                    'city' => $data['city'],
                    'latitude' => $data['lat'],
                    'longitude' => $data['lng'],
                ]);

                $category = Category::firstOrCreate(
                    ['category_name' => 'Restaurant'],
                    ['scope' => 'place']
                );

                Place::create([
                    'place_name' => $data['name'],
                    'place_description' => $data['description'],
                    'place_image' => null,
                    'place_website' => $data['website'],
                    'user' => null,
                    'address' => $address->id,
                    'category' => $category->id,
                    'status' => $this->option('publish') ? 'publie' : 'en_attente',
                ]);

                $this->imported++;
            }

            $page++;
            if ($delay > 0 && $page <= $lastPage) {
                sleep($delay);
            }
        } while ($page <= $lastPage);

        $this->newLine();
        $this->table(
            ['Importés', 'Doublons ignorés', 'Hors France ignorés', 'Erreurs'],
            [[$this->imported, $this->skippedDuplicate, $this->skippedForeign, $this->skippedError]]
        );

        return self::SUCCESS;
    }

    /**
     * @return array{0: list<array<string, mixed>>, 1: int, 2: int} [items, lastPage, total]
     */
    private function fetchPage(int $page): array
    {
        $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
            ->timeout(20)
            ->retry(3, 1000)
            ->get(self::API_URL, [
                'categories' => self::RESTAURANT_CATEGORY_ID,
                'per_page' => self::PER_PAGE,
                'page' => $page,
                '_fields' => implode(',', [
                    'title',
                    'meta_box.localisation_hotel_address',
                    'meta_box.ville_hotel',
                    'meta_box.code_postal_hotel_maps',
                    'meta_box.latitude_hotel',
                    'meta_box.longitude_hotel',
                    'meta_box.description_hotel',
                    'meta_box.url_hotel',
                ]),
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException("HTTP {$response->status()} pour la page {$page}");
        }

        $lastPage = (int) $response->header('X-WP-TotalPages', '1');
        $total = (int) $response->header('X-WP-Total', '0');

        return [$response->json() ?? [], max($lastPage, 1), $total];
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array{name: string, description: string, street: string, postal_code: string, city: string, lat: float, lng: float, website: ?string, raw_address: string}|null
     */
    private function extractData(array $item): ?array
    {
        $meta = $item['meta_box'] ?? [];

        $name = html_entity_decode((string) ($item['title']['rendered'] ?? ''), ENT_QUOTES | ENT_HTML5);
        $rawAddress = trim((string) ($meta['localisation_hotel_address'] ?? ''));
        $city = trim((string) ($meta['ville_hotel'] ?? ''));
        $postalCode = trim((string) ($meta['code_postal_hotel_maps'] ?? ''));
        $lat = isset($meta['latitude_hotel']) ? (float) $meta['latitude_hotel'] : 0.0;
        $lng = isset($meta['longitude_hotel']) ? (float) $meta['longitude_hotel'] : 0.0;

        if ($name === '' || $rawAddress === '' || $city === '' || $postalCode === '' || ($lat === 0.0 && $lng === 0.0)) {
            return null;
        }

        $description = trim(html_entity_decode((string) ($meta['description_hotel'] ?? ''), ENT_QUOTES | ENT_HTML5));
        // Almost every fiche's "description" is just the département name
        // (e.g. "Essonne") rather than real editorial content — only keep it
        // when it reads like an actual sentence, otherwise fall back to the
        // restaurant's own name like the emmenetonchien scrapers do for a
        // genuinely missing description.
        if ($description === '' || str_word_count($description) <= 3) {
            $description = $name;
        }

        // url_hotel is almost always a tripadvisor.fr review link rather than
        // the restaurant's own site, but it's still a genuine, useful link
        // (photos, reviews, hours) — kept as-is rather than filtered out.
        $website = trim((string) ($meta['url_hotel'] ?? ''));
        if ($website === '' || ! filter_var($website, FILTER_VALIDATE_URL)) {
            $website = null;
        }

        return [
            'name' => $name,
            'description' => $description,
            'street' => $this->extractStreet($rawAddress, $postalCode),
            'postal_code' => $postalCode,
            'city' => $city,
            'lat' => $lat,
            'lng' => $lng,
            'website' => $website,
            'raw_address' => $rawAddress,
        ];
    }

    /**
     * wawaf only exposes a single combined address string (e.g. "5 Avenue
     * Du Général De Gaulle, 91300 Massy France"), not separate street/city
     * fields like emmenetonchien's schema.org markup — strip the postal
     * code onward (city, any extra location detail, "France") to recover
     * just the street portion for our own `addresses.address` column.
     */
    private function extractStreet(string $rawAddress, string $postalCode): string
    {
        $pos = mb_strpos($rawAddress, $postalCode);
        if ($pos === false) {
            return $rawAddress;
        }

        $street = rtrim(mb_substr($rawAddress, 0, $pos), ", \t\n\r\0\x0B");

        return $street !== '' ? $street : $rawAddress;
    }

    private function isFrance(string $rawAddress): bool
    {
        return str_ends_with(strtolower(trim($rawAddress)), 'france');
    }

    private function placeAlreadyExists(string $name, string $city): bool
    {
        return Place::whereRaw('LOWER(place_name) = ?', [mb_strtolower(trim($name))])
            ->whereHas('address', function ($query) use ($city) {
                $query->whereRaw('LOWER(city) = ?', [mb_strtolower(trim($city))]);
            })
            ->exists();
    }
}
