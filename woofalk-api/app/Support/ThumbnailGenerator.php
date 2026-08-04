<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

// Place/Ballade/Hebergement photos are uploaded at up to 2MB (see the mimes|max
// validation in those controllers) with no server-side resizing, then rendered
// at ~150px in list cards — every listing page was downloading full-resolution
// phone photos just to shrink them in CSS. This generates a "thumb_" sibling
// file next to the original, used by the list cards; detail pages keep the
// original for full quality.
class ThumbnailGenerator
{
    private const WIDTH = 400;

    private const JPEG_QUALITY = 82;

    /**
     * @param  string  $directory  Same relative storage path passed to storeAs() for the original (e.g. "public/uploads/places").
     * @param  string  $filename  Filename of the already-stored original.
     */
    public static function make(string $directory, string $filename): void
    {
        $sourcePath = Storage::path($directory.'/'.$filename);

        $manager = new ImageManager(new Driver());
        $image = $manager->read($sourcePath)->scaleDown(width: self::WIDTH);

        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $encoded = $extension === 'png'
            ? $image->toPng()
            : $image->toJpeg(self::JPEG_QUALITY);

        Storage::put($directory.'/'.self::thumbFilename($filename), (string) $encoded);
    }

    /**
     * Delete the thumbnail alongside an original being replaced/removed. Safe
     * to call even if the thumbnail doesn't exist (e.g. pre-migration images).
     */
    public static function delete(string $directory, string $filename): void
    {
        Storage::delete($directory.'/'.self::thumbFilename($filename));
    }

    public static function thumbFilename(string $filename): string
    {
        return 'thumb_'.$filename;
    }
}
