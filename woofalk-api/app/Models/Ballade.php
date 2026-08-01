<?php

namespace App\Models;

use App\Models\Concerns\HasComments;
use App\Models\Concerns\HasReports;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Ballade extends Model
{
    use HasComments, HasFactory, HasReports;

    protected $casts = [
        'ballade_latitude' => 'float',
        'ballade_longitude' => 'float',
        'distance' => 'float',
    ];

    protected $fillable = [
        'ballade_name',
        'distance',
        'denivele',
        'ballade_description',
        'ballade_image',
        'ballade_website',
        'ballade_latitude',
        'ballade_longitude',
        'user',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->BelongsTo(User::class, 'user');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function likedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'ballade_likes')->withTimestamps();
    }

    private const DENIVELE_FACILE_MAX = 500;

    private const DENIVELE_MOYEN_MAX = 1000;

    private const DISTANCE_COURT_MAX = 10;

    /**
     * Difficulty ("Facile" below 500m of dénivelé, "Moyen" up to 1000m,
     * "Difficile" beyond) and length ("Court" under 10km, "Long" otherwise)
     * tag names for a ballade, derived from its distance/dénivelé. Either (or
     * both) is omitted when the corresponding value isn't known — not every
     * ballade has one (see the emmenetonchien scraper). Used both by that
     * scraper and by BalladeController so newly created/edited ballades are
     * auto-tagged the same way.
     *
     * @return list<string>
     */
    public static function difficultyAndLengthTagNames(?float $distanceKm, ?int $deniveleM): array
    {
        $tags = [];

        if ($deniveleM !== null) {
            $tags[] = match (true) {
                $deniveleM < self::DENIVELE_FACILE_MAX => 'Facile',
                $deniveleM <= self::DENIVELE_MOYEN_MAX => 'Moyen',
                default => 'Difficile',
            };
        }

        if ($distanceKm !== null) {
            $tags[] = $distanceKm < self::DISTANCE_COURT_MAX ? 'Court' : 'Long';
        }

        return $tags;
    }
}
