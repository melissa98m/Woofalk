<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Report extends Model
{
    use HasFactory;

    public const SUBJECT_INAPPROPRIATE = 'Contenu inapproprié';

    public const SUBJECT_WRONG_LOCATION = 'Adresse ou localisation incorrecte';

    public const SUBJECT_OUTDATED = 'Information erronée ou obsolète';

    public const SUBJECT_CLOSED = "Lieu fermé ou n'existe plus";

    public const SUBJECT_DUPLICATE = 'Doublon';

    public const SUBJECT_OTHER = 'Autre';

    public const SUBJECTS = [
        self::SUBJECT_INAPPROPRIATE,
        self::SUBJECT_WRONG_LOCATION,
        self::SUBJECT_OUTDATED,
        self::SUBJECT_CLOSED,
        self::SUBJECT_DUPLICATE,
        self::SUBJECT_OTHER,
    ];

    // Number of unresolved reports a place/ballade/hebergement can accumulate
    // before it's automatically set back to "en_attente" for moderation.
    public const THRESHOLD = 5;

    protected $fillable = [
        'user_id',
        'subject',
        'message',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    protected $appends = ['reportable_label', 'reportable_type_slug'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reportable(): MorphTo
    {
        return $this->morphTo();
    }

    public function getReportableLabelAttribute(): ?string
    {
        return match (true) {
            $this->reportable instanceof Place => $this->reportable->place_name,
            $this->reportable instanceof Ballade => $this->reportable->ballade_name,
            $this->reportable instanceof Hebergement => $this->reportable->hebergement_name,
            default => null,
        };
    }

    public function getReportableTypeSlugAttribute(): ?string
    {
        return match (true) {
            $this->reportable instanceof Place => 'places',
            $this->reportable instanceof Ballade => 'ballades',
            $this->reportable instanceof Hebergement => 'hebergements',
            default => null,
        };
    }
}
