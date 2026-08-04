<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

// Central place to turn a validated image upload into a filename that's safe
// to store and serve. The stored extension is derived from the file's actual
// (content-sniffed) MIME type — never from the client-supplied filename — so
// a validated image can't be smuggled onto disk under a server-executable
// extension (e.g. a real PNG uploaded with a "shell.php" filename, which
// would otherwise pass the mimes:png,jpg,jpeg rule and be stored as .php).
class UploadedImageStorage
{
    private const EXTENSIONS_BY_MIME = [
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
    ];

    /**
     * Store $file under $directory (a "public/uploads/..." storage path
     * already covered by the mimes:png,jpg,jpeg|dimensions:... validation
     * rule) and generate its thumbnail. Returns the stored filename.
     *
     * $field is only used to attribute a validation error to the right form
     * field if decoding fails below — e.g. a file that passes the mimes/
     * dimensions rules (which only inspect the header) but whose body is
     * truncated or otherwise malformed, which GD can still choke on.
     */
    public static function store(UploadedFile $file, string $directory, string $field = 'image'): string
    {
        $extension = self::EXTENSIONS_BY_MIME[$file->getMimeType()] ?? null;
        if ($extension === null) {
            throw new RuntimeException('Unsupported image MIME type: '.$file->getMimeType());
        }

        $slug = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'image';
        $filename = $slug.'_'.time().'.'.$extension;

        $file->storeAs($directory, $filename);

        try {
            ThumbnailGenerator::make($directory, $filename);
        } catch (Throwable $e) {
            Storage::delete($directory.'/'.$filename);

            throw ValidationException::withMessages([
                $field => 'Ce fichier image est invalide ou corrompu.',
            ]);
        }

        return $filename;
    }
}
