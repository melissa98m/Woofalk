<?php

namespace App\Console\Commands;

use App\Console\Commands\Concerns\ScrapesEmmeneTonChien;
use App\Models\Ballade;
use App\Models\Tag;
use Illuminate\Console\Command;
use Symfony\Component\DomCrawler\Crawler;

/**
 * One-off/rerunnable import: scrapes the public "balade-rando-avec-un-chien"
 * listing directory on emmenetonchien.com and inserts matching walks into our
 * own `ballades` table.
 *
 * Unlike the place fiches, distance/dénivelé are never structured data here —
 * they only ever show up (inconsistently, and often not at all) as free text
 * inside the description ("Boucle de 9 kms", "dénivelé positif est de 128m",
 * or nothing at all for a park/viewpoint). Best-effort regex extraction is
 * used and left null when not confidently found, rather than skipping the
 * ballade or guessing a misleading 0.
 *
 * Same policy as the place scraper otherwise: no photos copied, no listings
 * outside France (BAN geocoder is France-only).
 */
class ScrapeBalladeRando extends Command
{
    use ScrapesEmmeneTonChien;

    protected $signature = 'scrape:balade-rando
        {--pages= : Max number of listing pages to crawl (default: all of them)}
        {--limit= : Max number of ballades to actually import}
        {--delay=1 : Seconds to wait between requests to emmenetonchien.com}
        {--publish : Import with status=publie instead of the default en_attente (pending review)}
        {--dry-run : Parse and report what would be imported, without writing to the database}';

    protected $description = "Import dog-friendly walks from emmenetonchien.com's balade-rando-avec-un-chien directory";

    protected function baseUrl(): string
    {
        return 'https://emmenetonchien.com/fiches/balade-rando-avec-un-chien/';
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

            if ($this->balladeAlreadyExists($data['name'])) {
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

            $tags = array_values(array_unique(array_merge(
                $data['tags'],
                Ballade::difficultyAndLengthTagNames($data['distance'], $data['denivele'])
            )));

            if ($dryRun) {
                $website = $data['website'] ? " site: {$data['website']}" : '';
                $tagList = $tags ? ' tags: '.implode(', ', $tags) : '';
                $distance = $data['distance'] !== null ? "{$data['distance']} km" : 'non renseignée';
                $denivele = $data['denivele'] !== null ? "+{$data['denivele']} m" : 'non renseigné';
                $this->line("  -> importerait « {$data['name']} » ({$data['city']}, {$coords['lat']}, {$coords['lng']}) distance: {$distance} dénivelé: {$denivele}{$website}{$tagList}");
                $this->imported++;

                continue;
            }

            $ballade = Ballade::create([
                'ballade_name' => $data['name'],
                'ballade_description' => $data['description'],
                'distance' => $data['distance'],
                'denivele' => $data['denivele'],
                'ballade_image' => null,
                'ballade_website' => $data['website'],
                'ballade_latitude' => $coords['lat'],
                'ballade_longitude' => $coords['lng'],
                'user' => null,
                'status' => $this->option('publish') ? 'publie' : 'en_attente',
            ]);

            if ($tags) {
                $tagIds = array_map(fn (string $tagName) => Tag::firstOrCreateForScope($tagName, 'ballade')->id, $tags);
                $ballade->tags()->sync($tagIds);
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
     * @return array{name: string, description: string, street: string, postal_code: string, city: ?string, country: string, website: ?string, distance: ?float, denivele: ?int, tags: list<string>}|null
     */
    private function scrapeDetailPage(string $url, int $delay): ?array
    {
        $html = $this->fetchHtml($url, $delay);
        $crawler = new Crawler($html);

        $name = $crawler->filter('h1.title')->count() > 0
            ? trim($crawler->filter('h1.title')->first()->text())
            : null;

        $street = $this->firstItempropText($crawler, 'streetAddress');
        $postalCode = $this->firstItempropText($crawler, 'postalCode');
        // addressLocality (city) is absent on some foreign listings — kept
        // optional here so those are reported as "hors France", not a
        // generic parsing error; France listings always carry it.
        $city = $this->firstItempropText($crawler, 'addressLocality');
        $country = $this->firstItempropText($crawler, 'addressCountry');
        $website = $this->firstItempropText($crawler, 'url');

        if (! $name || ! $street || ! $postalCode || ! $country) {
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

        // Some balades also carry the "Qualidog criteria" amenities block
        // seen on place fiches; most don't, in which case this is just empty.
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
            'distance' => $this->extractDistanceKm($description),
            'denivele' => $this->extractDeniveleM($description),
            'tags' => $tags,
        ];
    }

    /**
     * Best-effort: matches "9,6km", "9 kms", "Distance : 12 km", etc.
     * Returns null (not 0) when no confident match is found.
     */
    private function extractDistanceKm(string $description): ?float
    {
        if (! preg_match('/(\d+(?:[.,]\d+)?)\s*kms?\b/iu', $description, $m)) {
            return null;
        }

        return round((float) str_replace(',', '.', $m[1]), 1);
    }

    /**
     * Best-effort: matches "dénivelé positif est de 184m", "dénivelé: 128m",
     * or the reversed "171 m de dénivelé". Deliberately anchored on the word
     * "dénivelé" itself, not just any "X m" (a waterfall height or a statue
     * height in the same description would otherwise false-positive).
     * Returns null (not 0) when no confident match is found.
     */
    private function extractDeniveleM(string $description): ?int
    {
        if (preg_match('/d[ée]nivel[ée]?\s*(?:positif|n[ée]gatif)?\s*(?:est\s*(?:de\s*)?|:\s*|de\s*)?\+?\s*(\d+)\s*m\b/iu', $description, $m)) {
            return (int) $m[1];
        }

        if (preg_match('/(\d+)\s*m\s*de\s*d[ée]nivel[ée]?/iu', $description, $m)) {
            return (int) $m[1];
        }

        return null;
    }

    private function balladeAlreadyExists(string $name): bool
    {
        return Ballade::whereRaw('LOWER(ballade_name) = ?', [mb_strtolower(trim($name))])->exists();
    }
}
