<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Ballade;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Hebergement;
use App\Models\Place;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use ZipArchive;

class ExportController extends Controller
{
    /**
     * Whitelist of what admins may export as CSV: this is the only thing
     * that decides which tables/columns are reachable — the client only
     * ever sends keys that are looked up here, never a raw table/column
     * name. `password`/`remember_token` are intentionally left out of the
     * `users` entry so they can never be exported, selected or not.
     */
    private const EXPORTABLE = [
        'places' => [
            'label' => 'Lieux',
            'model' => Place::class,
            'columns' => ['id', 'place_name', 'place_description', 'place_website', 'status', 'user', 'address', 'category', 'created_at', 'updated_at'],
        ],
        'ballades' => [
            'label' => 'Balades',
            'model' => Ballade::class,
            'columns' => ['id', 'ballade_name', 'ballade_description', 'ballade_website', 'distance', 'denivele', 'ballade_latitude', 'ballade_longitude', 'status', 'user', 'created_at', 'updated_at'],
        ],
        'hebergements' => [
            'label' => 'Hébergements',
            'model' => Hebergement::class,
            'columns' => ['id', 'hebergement_name', 'hebergement_description', 'hebergement_website', 'price_indication', 'status', 'user', 'address', 'category', 'created_at', 'updated_at'],
        ],
        'categories' => [
            'label' => 'Catégories',
            'model' => Category::class,
            'columns' => ['id', 'category_name', 'scope', 'created_at', 'updated_at'],
        ],
        'tags' => [
            'label' => 'Tags',
            'model' => Tag::class,
            'columns' => ['id', 'tag_name', 'color', 'scope', 'created_at', 'updated_at'],
        ],
        'addresses' => [
            'label' => 'Adresses',
            'model' => Address::class,
            'columns' => ['id', 'address', 'postal_code', 'city', 'latitude', 'longitude', 'created_at', 'updated_at'],
        ],
        'users' => [
            'label' => 'Utilisateurs',
            'model' => User::class,
            'columns' => ['id', 'username', 'email', 'roles', 'email_verified_at', 'terms_accepted_at', 'created_at', 'updated_at'],
        ],
        'contacts' => [
            'label' => 'Messages de contact',
            'model' => Contact::class,
            'columns' => ['id', 'name', 'email', 'subject', 'contenu', 'replied_at', 'created_at', 'updated_at'],
        ],
    ];

    /**
     * Exportable tables/columns, for the admin UI to build its selection
     * form from.
     */
    public function options(): JsonResponse
    {
        $data = collect(self::EXPORTABLE)->map(function ($config, $key) {
            return [
                'key' => $key,
                'label' => $config['label'],
                'columns' => $config['columns'],
            ];
        })->values();

        return response()->json(['data' => $data]);
    }

    /**
     * CSV export of the tables/columns the admin selected: a plain .csv
     * when a single table is selected, a .zip of .csv files otherwise.
     */
    public function csv(Request $request)
    {
        $selection = $request->input('tables');

        if (! is_array($selection) || $selection === []) {
            return response()->json(['message' => 'Aucune table sélectionnée'], 422);
        }

        $files = [];

        foreach ($selection as $tableKey => $requestedColumns) {
            if (! is_string($tableKey) || ! array_key_exists($tableKey, self::EXPORTABLE)) {
                return response()->json(['message' => "Table inconnue : {$tableKey}"], 422);
            }

            $config = self::EXPORTABLE[$tableKey];
            $requestedColumns = is_array($requestedColumns) ? $requestedColumns : [];
            $columns = array_values(array_intersect($config['columns'], $requestedColumns));

            if ($columns === []) {
                $columns = $config['columns'];
            }

            $files[$tableKey] = $this->buildCsv($config['model'], $columns);
        }

        $timestamp = now()->format('Ymd-His');

        if (count($files) === 1) {
            $tableKey = array_key_first($files);

            return response($files[$tableKey], 200, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$tableKey}-{$timestamp}.csv\"",
            ]);
        }

        $zipPath = tempnam(sys_get_temp_dir(), 'gwd_csv_');
        $zip = new ZipArchive;
        $zip->open($zipPath, ZipArchive::OVERWRITE);
        foreach ($files as $tableKey => $csv) {
            $zip->addFromString("{$tableKey}.csv", $csv);
        }
        $zip->close();

        return response()->download($zipPath, "export-csv-{$timestamp}.zip")->deleteFileAfterSend(true);
    }

    /**
     * Full SQL dump of the database, zipped for download.
     *
     * Generated in PHP over the app's own DB connection rather than by
     * shelling out to `mysqldump`: the Alpine `mariadb-client` package this
     * image ships doesn't bundle the `caching_sha2_password` auth plugin
     * that MySQL 8 uses by default, so the CLI binary can't authenticate
     * even though the app's own pdo_mysql connection (mysqlnd) works fine.
     * Doing the dump over that same working connection sidesteps the gap
     * entirely and needs no extra system dependency.
     */
    public function sql()
    {
        $timestamp = now()->format('Ymd-His');
        $sqlPath = tempnam(sys_get_temp_dir(), 'gwd_sql_');
        $zipPath = tempnam(sys_get_temp_dir(), 'gwd_zip_');

        $handle = fopen($sqlPath, 'w');
        fwrite($handle, "-- Woofalk database export ({$timestamp})\n");
        // Without this, a reimport uses the client's own default charset to
        // interpret the file's string literals instead of utf8mb4 (the one
        // the app's DB connection — and thus every byte written below —
        // actually uses), silently mangling accented characters.
        fwrite($handle, "SET NAMES utf8mb4;\n");
        fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");

        $tables = collect(DB::select('SHOW TABLES'))->map(fn ($row) => array_values((array) $row)[0]);

        foreach ($tables as $table) {
            $createStatement = (array) DB::selectOne("SHOW CREATE TABLE `{$table}`");
            $createSql = $createStatement['Create Table'] ?? null;

            if ($createSql === null) {
                continue;
            }

            fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n{$createSql};\n\n");

            foreach (DB::table($table)->cursor() as $row) {
                $data = (array) $row;
                $columns = implode(', ', array_map(fn ($column) => "`{$column}`", array_keys($data)));
                $values = implode(', ', array_map([$this, 'quoteSqlValue'], array_values($data)));
                fwrite($handle, "INSERT INTO `{$table}` ({$columns}) VALUES ({$values});\n");
            }

            fwrite($handle, "\n");
        }

        fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
        fclose($handle);

        $zip = new ZipArchive;
        $zip->open($zipPath, ZipArchive::OVERWRITE);
        $zip->addFile($sqlPath, "woofalk-{$timestamp}.sql");
        $zip->close();
        @unlink($sqlPath);

        return response()->download($zipPath, "woofalk-db-{$timestamp}.zip")->deleteFileAfterSend(true);
    }

    private function quoteSqlValue($value): string
    {
        if ($value === null) {
            return 'NULL';
        }

        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        return DB::connection()->getPdo()->quote((string) $value);
    }

    private function buildCsv(string $modelClass, array $columns): string
    {
        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, $columns);

        // Every exportable table has timestamps, so order by `created_at`
        // rather than assuming a PK name (needed historically for `contacts`,
        // which had no `id` column before a later migration added one).
        $modelClass::query()
            ->select($columns)
            ->orderBy('created_at')
            ->chunk(500, function ($rows) use ($handle, $columns) {
                foreach ($rows as $row) {
                    fputcsv($handle, array_map(fn ($column) => $this->sanitizeCsvCell($row->{$column}), $columns));
                }
            });

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv;
    }

    /**
     * Prefixes values Excel/Sheets would interpret as a formula (leading
     * =, +, -, @, tab) with a single quote, so a user-submitted value (a
     * contact message, a place name, ...) can't execute a formula/DDE
     * payload once the export is opened locally.
     */
    private function sanitizeCsvCell($value): string
    {
        $value = (string) ($value ?? '');

        if ($value !== '' && str_contains("=+-@\t", $value[0])) {
            return "'".$value;
        }

        return $value;
    }
}
