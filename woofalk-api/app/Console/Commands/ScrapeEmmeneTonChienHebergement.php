<?php

namespace App\Console\Commands;

use App\Console\Commands\Concerns\ScrapesEmmeneTonChien;
use App\Models\Address;
use App\Models\Category;
use App\Models\Hebergement;
use App\Models\Tag;
use Illuminate\Console\Command;
use Symfony\Component\DomCrawler\Crawler;

/**
 * One-off/rerunnable import: scrapes the public "hebergement-chien-animaux-acceptes"
 * listing directory on emmenetonchien.com and inserts matching accommodations
 * (hotels, gîtes, campings, chambres d'hôtes, villages vacances, …) into our
 * own `hebergements`/`addresses` table.
 *
 * Unlike the place/ballade listings, individual fiche URLs under this
 * directory live under per-subtype category slugs (e.g.
 * /fiches/hotel-chien-animaux-acceptes/…, /fiches/camping-chien-animaux-acceptes/…)
 * rather than under the hebergement listing's own URL prefix, and the
 * listing also links to unrelated region/département fiches — so unlike the
 * place/ballade scrapers, detail URLs here can't be discovered by a simple
 * href-prefix filter and are instead read off each listing card's title
 * link (`.listing-block .listing-content h2.title a`).
 *
 * Deliberately does NOT copy photos (potential copyright issue — the images
 * belong to the listed venues or to emmenetonchien.com, not to us) and does
 * NOT import places outside France (our only geocoder, the BAN API, only
 * covers France, so we'd have no reliable lat/lng for them).
 */
class ScrapeEmmeneTonChienHebergement extends Command
{
    use ScrapesEmmeneTonChien;

    protected $signature = 'scrape:hebergement
        {--pages= : Max number of listing pages to crawl (default: all of them)}
        {--limit= : Max number of hebergements to actually import}
        {--delay=1 : Seconds to wait between requests to emmenetonchien.com}
        {--publish : Import with status=publie instead of the default en_attente (pending review)}
        {--dry-run : Parse and report what would be imported, without writing to the database}';

    protected $description = "Import dog-friendly accommodations from emmenetonchien.com's hebergement directory "
        .'(~2 600 fiches across ~55 listing pages — use --pages/--limit for a first, smaller run)';

    protected function baseUrl(): string
    {
        return 'https://emmenetonchien.com/fiches/hebergement-chien-animaux-acceptes/';
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

            if ($this->hebergementAlreadyExists($data['name'])) {
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
                $price = $data['price_indication'] ? " tarif: {$data['price_indication']}" : '';
                $tags = $data['tags'] ? ' tags: '.implode(', ', $data['tags']) : '';
                $this->line("  -> importerait « {$data['name']} » [{$data['category']}] ({$data['city']}, {$coords['lat']}, {$coords['lng']}){$website}{$price}{$tags}");
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

            $category = Category::firstOrCreate(
                ['category_name' => $data['category']],
                ['scope' => 'hebergement']
            );

            $hebergement = Hebergement::create([
                'hebergement_name' => $data['name'],
                'hebergement_description' => $data['description'],
                'hebergement_image' => null,
                'hebergement_website' => $data['website'],
                'price_indication' => $data['price_indication'],
                'user' => null,
                'address' => $address->id,
                'category' => $category->id,
                'status' => $this->option('publish') ? 'publie' : 'en_attente',
            ]);

            if ($data['tags']) {
                $tagIds = array_map(
                    // scope 'hebergement': these amenities only ever come from
                    // this scraper, never from the place/ballade ones.
                    fn (string $tagName) => Tag::firstOrCreate(
                        ['tag_name' => $tagName],
                        ['color' => $this->randomHexColor(), 'scope' => 'hebergement']
                    )->id,
                    $data['tags']
                );
                $hebergement->tags()->sync($tagIds);
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
     * Overrides ScrapesEmmeneTonChien::collectDetailUrls(): fiche URLs here
     * live under per-subtype category slugs, not under this listing's own
     * URL prefix, and the listing also links to unrelated region/département
     * fiches — so detail URLs are read off each card's title link instead
     * of filtered by href prefix.
     *
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
        $this->extractDetailUrlsFromListingPage($crawler, $urls);

        for ($page = 2; $page <= $lastPage; $page++) {
            $html = $this->fetchHtml($this->baseUrl()."page/{$page}/", $delay);
            $this->extractDetailUrlsFromListingPage(new Crawler($html), $urls);
        }

        return array_values(array_unique($urls));
    }

    /**
     * @param  array<int, string>  $urls
     */
    private function extractDetailUrlsFromListingPage(Crawler $crawler, array &$urls): void
    {
        $crawler->filter('.listing-block .listing-content h2.title a')->each(function (Crawler $node) use (&$urls) {
            $href = (string) $node->attr('href');
            if ($href !== '') {
                $urls[] = $href;
            }
        });
    }

    /**
     * @return array{name: string, description: string, street: string, postal_code: string, city: ?string, country: string, website: ?string, price_indication: ?string, category: string, tags: list<string>}|null
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

        $priceIndication = $this->extractPriceIndication($crawler);

        return [
            'name' => $name,
            'description' => $description,
            'street' => $street,
            'postal_code' => $postalCode,
            'city' => $city,
            'country' => $country,
            'website' => $website,
            'price_indication' => $priceIndication,
            'category' => $category,
            'tags' => $tags,
        ];
    }

    /**
     * Best-effort: the "Tarif chien" line lives in a free-text block (e.g.
     * "Hébergement : 40€/Jour/Chien - Dog-sitting 25€/h - …") next to
     * "Supplément chien"/"Chats admis" — not every fiche carries one, so
     * this returns null rather than blocking the import when absent.
     */
    private function extractPriceIndication(Crawler $crawler): ?string
    {
        $price = null;
        $crawler->filter('.listing-more-animals-content .box-content > div')->each(function (Crawler $div) use (&$price) {
            if ($price !== null || $div->filter('strong')->count() === 0) {
                return;
            }
            $label = trim($div->filter('strong')->first()->text());
            if (stripos($label, 'Tarif chien') === false) {
                return;
            }
            $fullText = trim(preg_replace('/\s+/', ' ', $div->text()));
            $fullText = preg_replace('/^Tarif chien\s*:\s*/i', '', $fullText);
            $price = trim(rtrim(trim($fullText), " -\t\n\r"));
        });

        return $price !== '' ? $price : null;
    }

    private function hebergementAlreadyExists(string $name): bool
    {
        return Hebergement::whereRaw('LOWER(hebergement_name) = ?', [mb_strtolower(trim($name))])->exists();
    }
}
