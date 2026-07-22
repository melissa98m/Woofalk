<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ballade extends Model
{
    use HasFactory;
    protected $casts = [
        'ballade_latitude' => 'float',
        'ballade_longitude' => 'float',
    ];
    protected $fillable = [
        'ballade_name' ,
        'distance',
        'denivele',
        'ballade_description',
        'ballade_image',
        'ballade_latitude',
        'ballade_longitude',
        'user',
        'tag',
        'status'
    ];

    public function user(): BelongsTo
    {
        return $this->BelongsTo(User::class, 'user');
    }
    public function tag(): BelongsTo
    {
        return $this->BelongsTo(Tag::class, 'tag');
    }
}
