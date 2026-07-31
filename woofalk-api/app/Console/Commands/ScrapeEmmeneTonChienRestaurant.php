<?php

namespace App\Console\Commands;

use App\Console\Commands\Concerns\ScrapesEmmeneTonChien;
use App\Models\Address;
use App\Models\Category;
use App\Models\Place;
use App\Models\Tag;
use Illuminate\Console\Command;
use Symfony\Component\DomCrawler\Crawler;

/**
 * One-off/rerunnable import: scrapes the public "restaurant-chien-accepte"
 * listing directory on emmenetonchien.com and inserts matching restaurants
 * into our own `places`/`addresses` tables.
 *
 * Unlike the beach listing, restaurant fiches carry the same schema.org
 * PostalAddress (with streetAddress) and amenities list as the general
 * "visite-chien-accepte" fiches scraped by ScrapeEmmeneTonChien, and detail
 * URLs live under this listing's own URL prefix — so this command mirrors
 * that one almost exactly, just pointed at a different listing directory.
 *
 * Deliberately does NOT copy photos (potential copyright issue — the images
 * belong to the listed venues or to emmenetonchien.com, not to us) and does
 * NOT import places outside France (our only geocoder, the BAN API, only
 * covers France, so we'd have no reliable lat/lng for them).
 */
class ScrapeEmmeneTonChienRestaurant extends Command
{
    use ScrapesEmmeneTonChien;

    protected $signature = 'scrape:emmenetonchien-restaurant
        {--pages= : Max number of listing pages to crawl (default: all of them)}
        {--limit= : Max number of places to actually import}
        {--delay=1 : Seconds to wait between requests to emmenetonchien.com}
        {--publish : Import with status=publie instead of the default en_attente (pending review)}
        {--dry-run : Parse and report what would be imported, without writing to the database}';

    protected $description = "Import dog-friendly restaurants from emmenetonchien.com's restaurant-chien-accepte directory";

    protected function baseUrl(): string
    {
        return 'https://emmenetonchien.com/fiches/restaurant-chien-accepte/';
    }

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
                    // scope 'place': these amenities only ever come from the
                    // place scrapers, never from the ballade one.
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
        // addressLocality (city) is absent on some foreign listings — kept
        // optional here so those are reported as "hors France", not a
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

    private function placeAlreadyExists(string $name): bool
    {
        return Place::whereRaw('LOWER(place_name) = ?', [mb_strtolower(trim($name))])->exists();
    }
}
