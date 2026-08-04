<?php

namespace App\Console\Commands;

use App\Models\Ballade;
use App\Models\Hebergement;
use App\Models\Place;
use App\Support\ThumbnailGenerator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Backfills "thumb_" list-card thumbnails for images uploaded before
 * ThumbnailGenerator existed (PlaceController/BalladeController/
 * HebergementController now generate one on every new upload). Safe to
 * re-run: skips any record whose thumbnail file already exists.
 */
class GenerateImageThumbnails extends Command
{
    protected $signature = 'images:generate-thumbnails {type? : places|ballades|hebergements (all three if omitted)}';

    protected $description = 'Backfill list-card thumbnails for existing place/ballade/hebergement images';

    /**
     * @var array<string, array{model: class-string, column: string, directory: string}>
     */
    private const TYPES = [
        'places' => ['model' => Place::class, 'column' => 'place_image', 'directory' => 'public/uploads/places'],
        'ballades' => ['model' => Ballade::class, 'column' => 'ballade_image', 'directory' => 'public/uploads/ballades'],
        'hebergements' => ['model' => Hebergement::class, 'column' => 'hebergement_image', 'directory' => 'public/uploads/hebergements'],
    ];

    public function handle(): int
    {
        $type = $this->argument('type');
        if ($type !== null && ! isset(self::TYPES[$type])) {
            $this->error("Type inconnu : {$type}. Valeurs possibles : ".implode(', ', array_keys(self::TYPES)));

            return self::FAILURE;
        }

        $types = $type !== null ? [$type => self::TYPES[$type]] : self::TYPES;

        foreach ($types as $label => $config) {
            $this->generateFor($label, $config['model'], $config['column'], $config['directory']);
        }

        return self::SUCCESS;
    }

    private function generateFor(string $label, string $model, string $column, string $directory): void
    {
        $generated = 0;
        $skipped = 0;
        $missing = 0;

        $model::query()
            ->whereNotNull($column)
            ->select(['id', $column])
            ->chunkById(100, function ($records) use ($column, $directory, &$generated, &$skipped, &$missing) {
                foreach ($records as $record) {
                    $filename = $record->{$column};
                    if (Storage::exists($directory.'/'.ThumbnailGenerator::thumbFilename($filename))) {
                        $skipped++;

                        continue;
                    }
                    if (! Storage::exists($directory.'/'.$filename)) {
                        $this->warn("Fichier source introuvable pour #{$record->id} : {$filename}");
                        $missing++;

                        continue;
                    }

                    ThumbnailGenerator::make($directory, $filename);
                    $generated++;
                }
            });

        $this->info("{$label} : {$generated} miniature(s) générée(s), {$skipped} déjà présente(s), {$missing} fichier(s) source introuvable(s).");
    }
}
