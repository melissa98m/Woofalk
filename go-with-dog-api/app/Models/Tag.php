<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = ['tag_name', 'color', 'scope'];

    public function places()
    {
        return $this->belongsToMany(Place::class);
    }

    public function ballades()
    {
        return $this->belongsToMany(Ballade::class);
    }

    /**
     * Find a tag by name, or create it with a random color for the given
     * scope. Shared by the import scrapers and any server-side auto-tagging
     * (e.g. ballade difficulty/length) so a random color isn't reinvented in
     * every caller.
     */
    public static function firstOrCreateForScope(string $name, string $scope): self
    {
        return static::firstOrCreate(
            ['tag_name' => $name],
            ['color' => sprintf('#%06X', random_int(0, 0xFFFFFF)), 'scope' => $scope]
        );
    }
}
