<?php

namespace App\Console\Commands;

use App\Models\Ballade;
use App\Models\Hebergement;
use App\Models\Place;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Rewrites the descriptions scraped from emmenetonchien.com/wawaf.fr (see the
 * Scrape* commands) via the Anthropic Messages API so Woofalk's fiches stop
 * duplicating the source site's wording. Resumable: each processed record
 * gets `description_rewritten_at` stamped, so interrupted/rerun invocations
 * only pick up records that haven't been rewritten yet.
 */
class RewriteDescriptions extends Command
{
    protected $signature = 'descriptions:rewrite
        {type=all : places|ballades|hebergements|all}
        {--limit= : Maximum number of records to process in this run}
        {--chunk=50 : Number of records fetched per DB query}
        {--delay=1 : Seconds to sleep between API calls, to stay under rate limits}
        {--ids= : Comma-separated record IDs to (re)process, ignoring description_rewritten_at}
        {--dry-run : Print the rewritten description without saving it}';

    protected $description = "Reformulate scraped place/ballade/hebergement descriptions via the Anthropic API so they no longer duplicate the source site's wording";

    private const SYSTEM_PROMPT = <<<'TXT'
        Tu es rédacteur web pour Woofalk, un annuaire francophone de lieux, hébergements
        et balades accessibles aux chiens. On te donne la description brute d'une fiche,
        récupérée par scraping sur un autre site. Réécris-la entièrement avec ton propre
        style et vocabulaire pour qu'elle ne soit plus un duplicata de la source, tout en
        gardant exactement les mêmes informations factuelles (adresse, distances,
        équipements, horaires, règles concernant les chiens, etc.) — n'invente aucun fait
        nouveau et n'en supprime aucun. Ton naturel et informatif, adapté à une fiche
        d'annuaire, en français, longueur similaire à l'original (± 20%). Réponds
        uniquement avec le texte de la nouvelle description, sans titre, sans guillemets,
        sans markdown.
        TXT;

    /**
     * @var array<string, array{model: class-string, name: string, description: string, label: string}>
     */
    private const TYPES = [
        'places' => ['model' => Place::class, 'name' => 'place_name', 'description' => 'place_description', 'label' => 'lieu'],
        'ballades' => ['model' => Ballade::class, 'name' => 'ballade_name', 'description' => 'ballade_description', 'label' => 'balade'],
        'hebergements' => ['model' => Hebergement::class, 'name' => 'hebergement_name', 'description' => 'hebergement_description', 'label' => 'hébergement'],
    ];

    public function handle(): int
    {
        $type = $this->argument('type');
        if ($type !== 'all' && ! isset(self::TYPES[$type])) {
            $this->error("Type inconnu : {$type}. Valeurs possibles : all, ".implode(', ', array_keys(self::TYPES)));

            return self::FAILURE;
        }

        if (! config('services.anthropic.key')) {
            $this->error('ANTHROPIC_API_KEY manquant dans .env.');

            return self::FAILURE;
        }

        $types = $type === 'all' ? array_keys(self::TYPES) : [$type];
        $limit = $this->option('limit') !== null ? (int) $this->option('limit') : null;
        $processed = 0;

        foreach ($types as $t) {
            $remaining = $limit === null ? null : $limit - $processed;
            if ($remaining !== null && $remaining <= 0) {
                break;
            }
            $processed += $this->processType($t, self::TYPES[$t], $remaining);
        }

        $this->info("{$processed} description(s) reformulée(s).");

        return self::SUCCESS;
    }

    /**
     * @return list<int>|null
     */
    private function requestedIds(): ?array
    {
        $ids = $this->option('ids');
        if ($ids === null || trim($ids) === '') {
            return null;
        }

        return array_values(array_filter(array_map('intval', explode(',', $ids))));
    }

    /**
     * @param  array{model: class-string, name: string, description: string, label: string}  $typeConfig
     */
    private function processType(string $type, array $typeConfig, ?int $limit): int
    {
        $model = $typeConfig['model'];
        $nameCol = $typeConfig['name'];
        $descCol = $typeConfig['description'];
        $label = $typeConfig['label'];

        $ids = $this->requestedIds();

        $scope = function () use ($model, $ids) {
            $query = $model::query();

            // Without explicit --ids, only touch bot-imported (scraped) records: `user`
            // is null for those, whereas seeded fixtures and genuine user submissions
            // have an owner and must never be silently rewritten.
            return $ids !== null
                ? $query->whereIn('id', $ids)
                : $query->whereNull('description_rewritten_at')->whereNull('user');
        };

        $total = $scope()->count();
        if ($limit !== null) {
            $total = min($total, $limit);
        }

        if ($total === 0) {
            $this->info("Aucune fiche « {$type} » à reformuler.");

            return 0;
        }

        $this->info("Reformulation de {$total} fiche(s) « {$type} »...");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $processed = 0;
        $chunkSize = (int) $this->option('chunk');
        $delay = (int) $this->option('delay');
        $dryRun = (bool) $this->option('dry-run');

        $scope()->chunkById($chunkSize, function ($records) use (&$processed, $limit, $nameCol, $descCol, $label, $delay, $dryRun, $bar) {
            foreach ($records as $record) {
                if ($limit !== null && $processed >= $limit) {
                    return false;
                }

                $original = $record->{$descCol};
                $rewritten = $this->rewrite($record->{$nameCol}, $original, $label);

                if ($rewritten === null) {
                    $this->newLine();
                    $this->warn("Échec pour la fiche #{$record->id} ({$record->{$nameCol}}), ignorée — sera retentée au prochain run.");
                } elseif ($dryRun) {
                    $this->newLine();
                    $this->line("#{$record->id} {$record->{$nameCol}}");
                    $this->line("Avant: {$original}");
                    $this->line("Après: {$rewritten}");
                } else {
                    $record->{$descCol} = $rewritten;
                    $record->description_rewritten_at = now();
                    $record->save();
                }

                $processed++;
                $bar->advance();

                if ($delay > 0) {
                    sleep($delay);
                }
            }

            return null;
        });

        $bar->finish();
        $this->newLine();

        return $processed;
    }

    private function rewrite(string $name, string $description, string $label): ?string
    {
        $response = Http::withHeaders([
            'x-api-key' => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ])
            ->timeout(30)
            ->retry(3, 2000, throw: false)
            ->post('https://api.anthropic.com/v1/messages', [
                'model' => config('services.anthropic.model'),
                'max_tokens' => 500,
                'system' => self::SYSTEM_PROMPT,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => "Type de fiche : {$label}\nNom : {$name}\nDescription originale :\n{$description}",
                    ],
                ],
            ]);

        if (! $response->successful()) {
            Log::warning('descriptions:rewrite — appel Anthropic échoué', [
                'name' => $name,
                'status' => $response->status(),
                'body' => Str::limit($response->body(), 500),
            ]);

            return null;
        }

        $text = $response->json('content.0.text');

        if (! is_string($text) || trim($text) === '') {
            Log::warning('descriptions:rewrite — réponse Anthropic sans texte exploitable', [
                'name' => $name,
                'stop_reason' => $response->json('stop_reason'),
            ]);

            return null;
        }

        return trim($text);
    }
}
