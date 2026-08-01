<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\CachesListing;
use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Ballade;
use App\Models\Category;
use App\Models\Hebergement;
use App\Models\Place;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * Whitelisted CSV import for admins, the mirror image of ExportController.
 *
 * `users`/`contacts` are deliberately not importable: bulk account creation
 * from a CSV is a needless privilege-escalation surface, and importing
 * contact messages has no legitimate use case. Every other resource is
 * matched to existing rows by human-readable name (+ address/coordinates
 * where relevant) rather than id — an admin's spreadsheet has no idea what
 * our internal ids are, and trusting a CSV-supplied id to target a row to
 * overwrite would be an IDOR waiting to happen.
 *
 * A `preview` (dry-run, no writes) must be run before `commit` — the
 * front-end enforces that by only enabling the confirm step after a
 * successful preview, but `commit` also independently re-parses and
 * re-validates the freshly re-uploaded file rather than trusting anything
 * cached from the preview call, so there is no server-side trust gap
 * between what was shown and what gets written.
 */
class ImportController extends Controller
{
    use CachesListing;

    /**
     * Bounds how many data rows a single import can contain, so a huge file
     * can't tie up a request/worker indefinitely.
     */
    private const MAX_ROWS = 2000;

    /**
     * Expected CSV header columns per importable resource, and whether each
     * is required. Columns map to human-readable fields (names, not our
     * internal FK ids) since that's what an admin's spreadsheet actually
     * has. Any header column not listed here is ignored, not an error.
     */
    private const COLUMNS = [
        'places' => [
            'place_name' => true, 'place_description' => true, 'place_website' => false,
            'status' => false, 'address' => true, 'postal_code' => true, 'city' => true,
            'latitude' => false, 'longitude' => false, 'category_name' => true, 'tags' => false,
        ],
        'hebergements' => [
            'hebergement_name' => true, 'hebergement_description' => true, 'hebergement_website' => false,
            'price_indication' => false, 'status' => false, 'address' => true, 'postal_code' => true,
            'city' => true, 'latitude' => false, 'longitude' => false, 'category_name' => true, 'tags' => false,
        ],
        'ballades' => [
            'ballade_name' => true, 'ballade_description' => true, 'ballade_website' => false,
            'distance' => false, 'denivele' => false, 'ballade_latitude' => true, 'ballade_longitude' => true,
            'status' => false, 'tags' => false,
        ],
        'categories' => [
            'category_name' => true, 'scope' => false,
        ],
        'tags' => [
            'tag_name' => true, 'color' => false, 'scope' => false,
        ],
        'addresses' => [
            'address' => true, 'postal_code' => true, 'city' => true, 'latitude' => true, 'longitude' => true,
        ],
    ];

    private const LABELS = [
        'places' => 'Lieux',
        'ballades' => 'Balades',
        'hebergements' => 'Hébergements',
        'categories' => 'Catégories',
        'tags' => 'Tags',
        'addresses' => 'Adresses',
    ];

    /**
     * The app has no lang/fr validation catalog (Laravel falls back to
     * English), but every other user-facing string in this controller — and
     * in the app generally — is French, so raw Laravel messages would stick
     * out. Scoped to this controller's own Validator::make() calls rather
     * than adding an app-wide lang/fr/validation.php.
     *
     * Custom-message arrays passed to Validator::make() only resolve plain
     * rule names or "attribute.rule" keys (Validator::getFromLocalArray) —
     * unlike lang/xx/validation.php, they do NOT support the
     * "rule.valuetype" nesting (e.g. "between.numeric"), so this stays flat
     * and uses an "attribute.rule" override only where the generic message
     * text would be wrong for one specific field (the uploaded file's own
     * size, in KB, vs. every other field's size, in characters).
     */
    private const VALIDATION_MESSAGES = [
        'required' => 'Le champ :attribute est obligatoire.',
        'max' => 'Le champ :attribute ne doit pas dépasser :max caractères.',
        'file.max' => 'Le fichier ne doit pas dépasser :max Ko.',
        'numeric' => 'Le champ :attribute doit être un nombre.',
        'integer' => 'Le champ :attribute doit être un nombre entier.',
        'between' => 'Le champ :attribute doit être compris entre :min et :max.',
        'url' => 'Le champ :attribute doit être une URL valide.',
        'in' => 'La valeur du champ :attribute est invalide.',
        'mimes' => 'Le fichier doit être de type : :values.',
        'file' => 'Le champ :attribute doit être un fichier.',
        'string' => 'Le champ :attribute doit être une chaîne de caractères.',
    ];

    private const ATTRIBUTE_LABELS = [
        'table' => 'table',
        'file' => 'fichier',
        'place_name' => 'nom du lieu',
        'place_description' => 'description',
        'place_website' => 'site web',
        'hebergement_name' => "nom de l'hébergement",
        'hebergement_description' => 'description',
        'hebergement_website' => 'site web',
        'price_indication' => 'indication de prix',
        'status' => 'statut',
        'address' => 'adresse',
        'postal_code' => 'code postal',
        'city' => 'ville',
        'latitude' => 'latitude',
        'longitude' => 'longitude',
        'category_name' => 'nom de la catégorie',
        'tags' => 'tags',
        'ballade_name' => 'nom de la balade',
        'ballade_description' => 'description',
        'ballade_website' => 'site web',
        'distance' => 'distance',
        'denivele' => 'dénivelé',
        'ballade_latitude' => 'latitude',
        'ballade_longitude' => 'longitude',
        'scope' => 'portée',
        'tag_name' => 'nom du tag',
        'color' => 'couleur',
    ];

    /**
     * Listing caches to invalidate after a commit actually writes something,
     * mirroring each resource controller's own CACHE_KEY(S).
     */
    private const CACHE_KEYS = [
        'places' => ['places.index'],
        'ballades' => ['ballades.index'],
        'hebergements' => ['hebergements.index'],
        'categories' => ['categories.index', 'categories.index.place', 'categories.index.hebergement', 'categories.index.both'],
        'tags' => ['tags.index', 'tags.index.place', 'tags.index.ballade', 'tags.index.hebergement', 'tags.index.both'],
        'addresses' => ['addresses.index'],
    ];

    /**
     * Importable resources/columns, for the admin UI to build its picker
     * and column hints from.
     */
    public function options(): JsonResponse
    {
        $data = collect(self::COLUMNS)->map(fn ($columns, $key) => [
            'key' => $key,
            'label' => self::LABELS[$key],
            'columns' => collect($columns)->map(fn ($required, $name) => ['name' => $name, 'required' => $required])->values(),
        ])->values();

        return response()->json(['data' => $data]);
    }

    /**
     * Dry-run: parses and validates the file exactly like commit(), reports
     * what would happen per row, but never writes to the database.
     */
    public function preview(Request $request): JsonResponse
    {
        return $this->handle($request, commit: false);
    }

    /**
     * Re-parses and re-validates the (re-uploaded) file from scratch, then
     * actually writes valid rows — each row in its own transaction, so one
     * bad/conflicting row can't roll back the rows already committed in the
     * same file.
     */
    public function commit(Request $request): JsonResponse
    {
        return $this->handle($request, commit: true);
    }

    private function handle(Request $request, bool $commit): JsonResponse
    {
        Validator::make($request->all(), [
            'table' => 'required|string',
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ], self::VALIDATION_MESSAGES, self::ATTRIBUTE_LABELS)->validate();

        $table = $request->input('table');
        if (! array_key_exists($table, self::COLUMNS)) {
            return response()->json(['message' => "Table inconnue : {$table}"], 422);
        }

        try {
            $rows = $this->readCsv($request->file('file'), self::COLUMNS[$table]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $summary = ['total' => count($rows), 'toCreate' => 0, 'toUpdate' => 0, 'unchanged' => 0, 'errors' => 0];
        $results = [];

        foreach ($rows as $entry) {
            try {
                $outcome = match ($table) {
                    'places' => $this->processPlaceOrHebergementRow(Place::class, 'place', $entry['data'], $commit),
                    'hebergements' => $this->processPlaceOrHebergementRow(Hebergement::class, 'hebergement', $entry['data'], $commit),
                    'ballades' => $this->processBalladeRow($entry['data'], $commit),
                    'categories' => $this->processCategoryRow($entry['data'], $commit),
                    'tags' => $this->processTagRow($entry['data'], $commit),
                    'addresses' => $this->processAddressRow($entry['data'], $commit),
                };
            } catch (\Throwable $e) {
                $outcome = ['action' => 'error', 'name' => null, 'errors' => [$e->getMessage()]];
            }

            $outcome['row'] = $entry['row'];
            $results[] = $outcome;

            match ($outcome['action']) {
                'create' => $summary['toCreate']++,
                'update' => $summary['toUpdate']++,
                'unchanged' => $summary['unchanged']++,
                default => $summary['errors']++,
            };
        }

        if ($commit && ($summary['toCreate'] > 0 || $summary['toUpdate'] > 0)) {
            $this->forgetListing(...self::CACHE_KEYS[$table]);
        }

        return response()->json(['summary' => $summary, 'rows' => $results]);
    }

    /**
     * @return list<array{row: int, data: array<string, ?string>}>
     */
    private function readCsv(UploadedFile $file, array $expectedColumns): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            throw new \InvalidArgumentException('Impossible de lire le fichier.');
        }

        $header = fgetcsv($handle);
        if ($header === false || $header === null) {
            fclose($handle);
            throw new \InvalidArgumentException('Fichier CSV vide.');
        }

        // Strip a leading UTF-8 BOM (common when the CSV was saved from Excel).
        $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $header[0]);
        $indexByColumn = array_flip(array_map(fn ($h) => mb_strtolower(trim((string) $h)), $header));

        foreach ($expectedColumns as $name => $required) {
            if ($required && ! array_key_exists($name, $indexByColumn)) {
                fclose($handle);
                throw new \InvalidArgumentException("Colonne requise manquante dans l'en-tête : {$name}");
            }
        }

        $rows = [];
        $rowNumber = 1;
        while (($cells = fgetcsv($handle)) !== false) {
            $rowNumber++;
            if (count($cells) === 1 && $cells[0] === null) {
                continue; // blank line
            }
            if (count($rows) >= self::MAX_ROWS) {
                fclose($handle);
                throw new \InvalidArgumentException('Le fichier dépasse la limite de '.self::MAX_ROWS.' lignes.');
            }

            $data = [];
            foreach ($expectedColumns as $name => $required) {
                $idx = $indexByColumn[$name] ?? null;
                $value = $idx !== null && isset($cells[$idx]) ? trim((string) $cells[$idx]) : null;
                $data[$name] = $value === '' ? null : $value;
            }

            $rows[] = ['row' => $rowNumber, 'data' => $data];
        }

        fclose($handle);

        return $rows;
    }

    private function processPlaceOrHebergementRow(string $modelClass, string $kind, array $row, bool $commit): array
    {
        $nameColumn = "{$kind}_name";
        $descriptionColumn = "{$kind}_description";
        $websiteColumn = "{$kind}_website";

        $rules = [
            $nameColumn => 'required|max:200',
            $descriptionColumn => 'required',
            $websiteColumn => 'nullable|url|max:'.($kind === 'hebergement' ? 2048 : 255),
            'status' => 'nullable|in:publie,en_attente',
            'address' => 'required|max:100',
            'postal_code' => 'required|max:6',
            'city' => 'required|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'category_name' => 'required|max:50',
        ];
        if ($kind === 'hebergement') {
            $rules['price_indication'] = 'nullable|max:100';
        }

        $validator = Validator::make($row, $rules, self::VALIDATION_MESSAGES, self::ATTRIBUTE_LABELS);
        if ($validator->fails()) {
            return ['action' => 'error', 'name' => $row[$nameColumn] ?? null, 'errors' => $validator->errors()->all()];
        }

        $tagNames = $this->parseTagNames($row['tags'] ?? null);
        if (($tagError = $this->firstOversizedTagName($tagNames)) !== null) {
            return ['action' => 'error', 'name' => $row[$nameColumn], 'errors' => [$tagError]];
        }

        $work = function () use ($modelClass, $kind, $nameColumn, $descriptionColumn, $websiteColumn, $row, $tagNames, $commit) {
            $addressRes = $this->resolveAddress($row, $commit);
            if ($addressRes['error'] !== null) {
                return ['action' => 'error', 'name' => $row[$nameColumn], 'errors' => [$addressRes['error']]];
            }

            $categoryRes = $this->resolveCategory($row, $commit, $kind);

            $existing = $addressRes['id'] !== null
                ? $modelClass::whereRaw('LOWER('.$nameColumn.') = ?', [mb_strtolower($row[$nameColumn])])
                    ->where('address', $addressRes['id'])
                    ->first()
                : null;

            $attributes = [
                $nameColumn => $row[$nameColumn],
                $descriptionColumn => $row[$descriptionColumn],
                $websiteColumn => $row[$websiteColumn],
                'address' => $addressRes['id'],
                'category' => $categoryRes['id'],
                'status' => $row['status'] ?? ($existing->status ?? 'publie'),
            ];
            if ($kind === 'hebergement') {
                $attributes['price_indication'] = $row['price_indication'];
            }

            return $this->mainResourceOutcome($modelClass, $nameColumn, $existing, $attributes, $tagNames, $kind, $commit);
        };

        return $commit ? DB::transaction($work) : $work();
    }

    private function processBalladeRow(array $row, bool $commit): array
    {
        $validator = Validator::make($row, [
            'ballade_name' => 'required|max:200',
            'ballade_description' => 'required',
            'ballade_website' => 'nullable|url|max:255',
            'distance' => 'nullable|numeric',
            'denivele' => 'nullable|integer',
            'ballade_latitude' => 'required|numeric|between:-90,90',
            'ballade_longitude' => 'required|numeric|between:-180,180',
            'status' => 'nullable|in:publie,en_attente',
        ], self::VALIDATION_MESSAGES, self::ATTRIBUTE_LABELS);
        if ($validator->fails()) {
            return ['action' => 'error', 'name' => $row['ballade_name'] ?? null, 'errors' => $validator->errors()->all()];
        }

        $tagNames = $this->parseTagNames($row['tags'] ?? null);
        if (($tagError = $this->firstOversizedTagName($tagNames)) !== null) {
            return ['action' => 'error', 'name' => $row['ballade_name'], 'errors' => [$tagError]];
        }

        $lat = round((float) $row['ballade_latitude'], 6);
        $lng = round((float) $row['ballade_longitude'], 6);
        $nameLower = mb_strtolower($row['ballade_name']);

        $work = function () use ($row, $tagNames, $lat, $lng, $nameLower, $commit) {
            $existing = Ballade::whereRaw(
                'LOWER(ballade_name) = ? AND ROUND(ballade_latitude, 6) = ? AND ROUND(ballade_longitude, 6) = ?',
                [$nameLower, $lat, $lng]
            )->first();

            $attributes = [
                'ballade_name' => $row['ballade_name'],
                'ballade_description' => $row['ballade_description'],
                'ballade_website' => $row['ballade_website'],
                'distance' => $row['distance'] !== null ? (float) $row['distance'] : null,
                'denivele' => $row['denivele'] !== null ? (int) $row['denivele'] : null,
                'ballade_latitude' => $lat,
                'ballade_longitude' => $lng,
                'status' => $row['status'] ?? ($existing->status ?? 'publie'),
            ];

            return $this->mainResourceOutcome(Ballade::class, 'ballade_name', $existing, $attributes, $tagNames, 'ballade', $commit);
        };

        return $commit ? DB::transaction($work) : $work();
    }

    private function processCategoryRow(array $row, bool $commit): array
    {
        $validator = Validator::make($row, [
            'category_name' => 'required|max:50',
            'scope' => 'nullable|in:place,hebergement,both',
        ], self::VALIDATION_MESSAGES, self::ATTRIBUTE_LABELS);
        if ($validator->fails()) {
            return ['action' => 'error', 'name' => $row['category_name'] ?? null, 'errors' => $validator->errors()->all()];
        }

        $nameLower = mb_strtolower($row['category_name']);
        $work = function () use ($row, $nameLower, $commit) {
            $existing = Category::whereRaw('LOWER(category_name) = ?', [$nameLower])->first();
            $attributes = [
                'category_name' => $row['category_name'],
                'scope' => $row['scope'] ?? ($existing->scope ?? 'place'),
            ];

            return $this->simpleResourceOutcome(Category::class, $existing, $attributes, 'category_name', $commit);
        };

        return $commit ? DB::transaction($work) : $work();
    }

    private function processTagRow(array $row, bool $commit): array
    {
        $validator = Validator::make($row, [
            'tag_name' => 'required|max:50',
            'color' => 'nullable|max:10',
            'scope' => 'nullable|in:place,ballade,hebergement,both',
        ], self::VALIDATION_MESSAGES, self::ATTRIBUTE_LABELS);
        if ($validator->fails()) {
            return ['action' => 'error', 'name' => $row['tag_name'] ?? null, 'errors' => $validator->errors()->all()];
        }

        $nameLower = mb_strtolower($row['tag_name']);
        $work = function () use ($row, $nameLower, $commit) {
            $existing = Tag::whereRaw('LOWER(tag_name) = ?', [$nameLower])->first();
            $attributes = [
                'tag_name' => $row['tag_name'],
                'color' => $row['color'] ?? ($existing->color ?? $this->randomHexColor()),
                'scope' => $row['scope'] ?? ($existing->scope ?? 'both'),
            ];

            return $this->simpleResourceOutcome(Tag::class, $existing, $attributes, 'tag_name', $commit);
        };

        return $commit ? DB::transaction($work) : $work();
    }

    private function processAddressRow(array $row, bool $commit): array
    {
        $validator = Validator::make($row, [
            'address' => 'required|max:100',
            'postal_code' => 'required|max:6',
            'city' => 'required|max:100',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ], self::VALIDATION_MESSAGES, self::ATTRIBUTE_LABELS);
        if ($validator->fails()) {
            return ['action' => 'error', 'name' => $row['address'] ?? null, 'errors' => $validator->errors()->all()];
        }

        $work = function () use ($row, $commit) {
            $existing = Address::whereRaw('LOWER(address) = ? AND LOWER(postal_code) = ? AND LOWER(city) = ?', [
                mb_strtolower($row['address']), mb_strtolower($row['postal_code']), mb_strtolower($row['city']),
            ])->first();

            $attributes = [
                'address' => $row['address'],
                'postal_code' => $row['postal_code'],
                'city' => $row['city'],
                'latitude' => (float) $row['latitude'],
                'longitude' => (float) $row['longitude'],
            ];

            return $this->simpleResourceOutcome(Address::class, $existing, $attributes, 'address', $commit);
        };

        return $commit ? DB::transaction($work) : $work();
    }

    /**
     * Finds/creates the address a place/hebergement row refers to, by exact
     * case-insensitive (address, postal_code, city) match — never by id, and
     * never writes unless $commit is true, so it's safe to call from a
     * preview.
     *
     * @return array{id: ?int, error: ?string}
     */
    private function resolveAddress(array $row, bool $commit): array
    {
        $existing = Address::whereRaw('LOWER(address) = ? AND LOWER(postal_code) = ? AND LOWER(city) = ?', [
            mb_strtolower($row['address']), mb_strtolower($row['postal_code']), mb_strtolower($row['city']),
        ])->first();

        if ($existing) {
            return ['id' => $existing->id, 'error' => null];
        }

        if ($row['latitude'] === null || $row['longitude'] === null) {
            return ['id' => null, 'error' => 'Adresse inconnue : latitude et longitude sont requises pour en créer une nouvelle.'];
        }

        if (! $commit) {
            return ['id' => null, 'error' => null];
        }

        $address = Address::create([
            'address' => $row['address'],
            'postal_code' => $row['postal_code'],
            'city' => $row['city'],
            'latitude' => (float) $row['latitude'],
            'longitude' => (float) $row['longitude'],
        ]);

        return ['id' => $address->id, 'error' => null];
    }

    /**
     * Finds/creates the category a place/hebergement row refers to, by exact
     * case-insensitive name match — never writes unless $commit is true.
     *
     * @return array{id: ?int}
     */
    private function resolveCategory(array $row, bool $commit, string $defaultScope): array
    {
        $existing = Category::whereRaw('LOWER(category_name) = ?', [mb_strtolower($row['category_name'])])->first();

        if ($existing) {
            return ['id' => $existing->id];
        }

        if (! $commit) {
            return ['id' => null];
        }

        $category = Category::create([
            'category_name' => $row['category_name'],
            'scope' => $defaultScope,
        ]);

        return ['id' => $category->id];
    }

    /**
     * @return ?list<string> null means the column was absent/empty (leave
     *                       any existing tags untouched); [] is never
     *                       returned (an all-empty cell parses to null too).
     */
    private function parseTagNames(?string $raw): ?array
    {
        if ($raw === null || trim($raw) === '') {
            return null;
        }

        $names = array_values(array_unique(array_filter(
            array_map('trim', explode(';', $raw)),
            fn (string $n) => $n !== ''
        )));

        return $names === [] ? null : $names;
    }

    private function firstOversizedTagName(?array $tagNames): ?string
    {
        foreach ($tagNames ?? [] as $tagName) {
            if (mb_strlen($tagName) > 50) {
                return "Nom de tag trop long : {$tagName}";
            }
        }

        return null;
    }

    private function randomHexColor(): string
    {
        return sprintf('#%06X', random_int(0, 0xFFFFFF));
    }

    /**
     * Shared create/update/unchanged decision for the three tag-bearing
     * resources (places, hebergements, ballades). A null $tagNames means the
     * CSV didn't specify a tags column for this row — existing tags are left
     * alone rather than wiped. Only writes when $commit is true; a preview
     * call computes the same action by diffing against current DB state
     * without persisting anything.
     */
    private function mainResourceOutcome(string $modelClass, string $nameColumn, ?object $existing, array $attributes, ?array $tagNames, string $tagScope, bool $commit): array
    {
        $name = $attributes[$nameColumn];

        if ($existing === null) {
            if (! $commit) {
                return ['action' => 'create', 'name' => $name];
            }

            $attributes['user'] = Auth::id();
            $record = $modelClass::create($attributes);
            if ($tagNames) {
                $record->tags()->sync(array_map(
                    fn (string $n) => Tag::firstOrCreateForScope($n, $tagScope)->id,
                    $tagNames
                ));
            }

            return ['action' => 'create', 'name' => $name];
        }

        $tagsChanged = false;
        if ($tagNames !== null) {
            $existingTagNames = $existing->tags()->pluck('tag_name')
                ->map(fn ($t) => mb_strtolower($t))->sort()->values()->all();
            $csvTagNames = collect($tagNames)->map(fn ($t) => mb_strtolower($t))->unique()->sort()->values()->all();
            $tagsChanged = $existingTagNames !== $csvTagNames;
        }

        $fieldsChanged = $this->attributesDiffer($existing, $attributes);

        if (! $fieldsChanged && ! $tagsChanged) {
            return ['action' => 'unchanged', 'name' => $name];
        }

        if (! $commit) {
            return ['action' => 'update', 'name' => $name];
        }

        if ($fieldsChanged) {
            $existing->update($attributes);
        }
        if ($tagsChanged) {
            $existing->tags()->sync(array_map(
                fn (string $n) => Tag::firstOrCreateForScope($n, $tagScope)->id,
                $tagNames
            ));
        }

        return ['action' => 'update', 'name' => $name];
    }

    /**
     * Shared create/update/unchanged decision for the three tag-less
     * resources (categories, tags, addresses).
     */
    private function simpleResourceOutcome(string $modelClass, ?object $existing, array $attributes, string $nameColumn, bool $commit): array
    {
        $name = $attributes[$nameColumn];

        if ($existing === null) {
            if ($commit) {
                $modelClass::create($attributes);
            }

            return ['action' => 'create', 'name' => $name];
        }

        if (! $this->attributesDiffer($existing, $attributes)) {
            return ['action' => 'unchanged', 'name' => $name];
        }

        if ($commit) {
            $existing->update($attributes);
        }

        return ['action' => 'update', 'name' => $name];
    }

    private function attributesDiffer(object $existing, array $attributes): bool
    {
        foreach ($attributes as $key => $value) {
            $current = $existing->{$key};
            if (is_numeric($value) && is_numeric($current)) {
                if (abs((float) $value - (float) $current) > 0.0000001) {
                    return true;
                }

                continue;
            }
            if ((string) ($value ?? '') !== (string) ($current ?? '')) {
                return true;
            }
        }

        return false;
    }
}
