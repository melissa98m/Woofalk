<?php

namespace App\Console\Commands;

use App\Models\Ballade;
use App\Models\Hebergement;
use App\Models\Place;
use Illuminate\Console\Command;

/**
 * Applies descriptions rewritten by hand (e.g. by Claude Code directly in a
 * session, batch by batch) to the DB — the non-API counterpart to
 * `descriptions:rewrite`. Reads a JSON file of [{"id": 1, "description": "..."}]
 * and stamps `description_rewritten_at` on each, so both commands share the
 * same resumability bookkeeping.
 */
class ApplyRewrittenDescriptions extends Command
{
    protected $signature = 'descriptions:apply {type : places|ballades|hebergements} {file : Path to a JSON file of [{"id": 1, "description": "..."}]}';

    protected $description = 'Apply hand-written rewritten descriptions from a JSON file to the DB';

    /**
     * @var array<string, array{model: class-string, description: string}>
     */
    private const TYPES = [
        'places' => ['model' => Place::class, 'description' => 'place_description'],
        'ballades' => ['model' => Ballade::class, 'description' => 'ballade_description'],
        'hebergements' => ['model' => Hebergement::class, 'description' => 'hebergement_description'],
    ];

    public function handle(): int
    {
        $type = $this->argument('type');
        if (! isset(self::TYPES[$type])) {
            $this->error("Type inconnu : {$type}. Valeurs possibles : ".implode(', ', array_keys(self::TYPES)));

            return self::FAILURE;
        }

        $path = $this->argument('file');
        if (! is_file($path)) {
            $this->error("Fichier introuvable : {$path}");

            return self::FAILURE;
        }

        $entries = json_decode((string) file_get_contents($path), true);
        if (! is_array($entries)) {
            $this->error('JSON invalide : attendu un tableau de {"id": ..., "description": "..."}.');

            return self::FAILURE;
        }

        $model = self::TYPES[$type]['model'];
        $descCol = self::TYPES[$type]['description'];
        $applied = 0;

        foreach ($entries as $entry) {
            if (! isset($entry['id'], $entry['description']) || trim((string) $entry['description']) === '') {
                $this->warn('Entrée ignorée (id ou description manquant) : '.json_encode($entry));

                continue;
            }

            $record = $model::find($entry['id']);
            if ($record === null) {
                $this->warn("Fiche #{$entry['id']} introuvable, ignorée.");

                continue;
            }

            $record->{$descCol} = trim((string) $entry['description']);
            $record->description_rewritten_at = now();
            $record->save();
            $applied++;
        }

        $this->info("{$applied} description(s) appliquée(s) sur ".count($entries).' entrée(s).');

        return self::SUCCESS;
    }
}
