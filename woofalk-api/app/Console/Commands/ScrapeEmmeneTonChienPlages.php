<?php

namespace App\Console\Commands;

use App\Console\Commands\Concerns\ScrapesEmmeneTonChien;
use App\Models\Address;
use App\Models\Category;
use App\Models\Place;
use Illuminate\Console\Command;
use Symfony\Component\DomCrawler\Crawler;

/**
 * One-off/rerunnable import: scrapes the public "plage-chien-autorise" (dog
 * -friendly beaches) listing directory on emmenetonchien.com and inserts
 * matching places into our own `places`/`addresses` tables.
 *
 * Beach fiches on this site don't carry a street address (schema.org
 * PostalAddress only exposes postalCode/addressLocality/addressRegion/
 * addressCountry, no streetAddress) or an amenities list, unlike the
 * general "visite-chien-accepte" fiches scraped by ScrapeEmmeneTonChien —
 * so coordinates are read directly from the page's embedded map widget
 * config instead of being geocoded from an address via the BAN API (see
 * ScrapesEmmeneTonChien::extractInlineMapCoordinates()).
 *
 * Deliberately does NOT copy photos (potential copyright issue — the
 * images belong to the listed beaches or to emmenetonchien.com, not to
 * us) and does NOT import places outside France (their listings outside
 * France are rare for this fiche type and we have no reliable secondary
 * geocoder to sanity-check against).
 */
class ScrapeEmmeneTonChienPlages extends Command
{
    use ScrapesEmmeneTonChien;

    protected $signature = 'scrape:emmenetonchien-plages
        {--pages= : Max number of listing pages to crawl (default: all of them)}
        {--limit= : Max number of places to actually import}
        {--delay=1 : Seconds to wait between requests to emmenetonchien.com}
        {--publish : Import with status=publie instead of the default en_attente (pending review)}
        {--dry-run : Parse and report what would be imported, without writing to the database}';

    protected $description = "Import dog-friendly beaches from emmenetonchien.com's plage-chien-autorise directory";

    protected function baseUrl(): string
    {
        return 'https://emmenetonchien.com/fiches/plage-chien-autorise/';
    }

    private int $imported = 0;

    private int $skippedForeign = 0;

    private int $skippedNoCoords = 0;

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

        $this->info('Découverte des fiches sur '.$this->baseUrl());
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

            if ($data['coords'] === null) {
                $this->line('  ignoré (coordonnées introuvables sur la fiche)');
                $this->skippedNoCoords++;

                continue;
            }

            if ($this->placeAlreadyExists($data['name'])) {
                $this->line('  ignoré (déjà importé précédemment)');
                $this->skippedDuplicate++;

                continue;
            }

            if ($dryRun) {
                $this->line("  -> importerait « {$data['name']} » [{$data['category']}] ({$data['city']}, {$data['coords']['lat']}, {$data['coords']['lng']})");
                $this->imported++;

                continue;
            }

            $address = Address::create([
                'address' => $data['name'],
                'postal_code' => $data['postal_code'],
                'city' => $data['city'],
                'latitude' => $data['coords']['lat'],
                'longitude' => $data['coords']['lng'],
            ]);

            $category = Category::firstOrCreate(['category_name' => $data['category']]);

            Place::create([
                'place_name' => $data['name'],
                'place_description' => $data['description'],
                'place_image' => null,
                'place_website' => null,
                'user' => null,
                'address' => $address->id,
                'category' => $category->id,
                'status' => $this->option('publish') ? 'publie' : 'en_attente',
            ]);

            $this->imported++;
        }

        $this->newLine();
        $this->table(
            ['Importés', 'Doublons ignorés', 'Hors France ignorés', 'Coordonnées introuvables', 'Erreurs'],
            [[$this->imported, $this->skippedDuplicate, $this->skippedForeign, $this->skippedNoCoords, $this->skippedError]]
        );

        return self::SUCCESS;
    }

    /**
     * @return array{name: string, description: string, postal_code: string, city: ?string, country: string, category: string, coords: array{lat: float, lng: float}|null}|null
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

        $postalCode = $this->firstItempropText($crawler, 'postalCode');
        // addressLocality (city) is absent on some foreign listings — kept
        // optional here so those are reported as "hors France", not a
        // generic parsing error; France listings always carry it.
        $city = $this->firstItempropText($crawler, 'addressLocality');
        $country = $this->firstItempropText($crawler, 'addressCountry');

        if (! $name || ! $country || ! $category) {
            return null;
        }

        $descriptionParagraphs = $crawler->filter('.listing-description p')
            ->each(fn (Crawler $p) => trim($p->text()));
        $description = trim(preg_replace('/\s+/', ' ', implode(' ', array_filter($descriptionParagraphs))));
        if ($description === '') {
            $description = $name;
        }

        return [
            'name' => $name,
            'description' => $description,
            // absent on a large share of beach fiches (unlike the general
            // "visite-chien-accepte" ones) — addresses.postal_code is
            // NOT NULL, so fall back to an empty string rather than
            // dropping otherwise-valid listings.
            'postal_code' => $postalCode ?? '',
            'city' => $city,
            'country' => $country,
            'category' => $category,
            'coords' => $this->extractInlineMapCoordinates($html),
        ];
    }

    private function placeAlreadyExists(string $name): bool
    {
        return Place::whereRaw('LOWER(place_name) = ?', [mb_strtolower(trim($name))])->exists();
    }
}
