<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Place extends Model
{
    use HasFactory;

    protected $fillable = [
        'place_name',
        'place_description',
        'place_image',
        'user',
        'address',
        'category',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->BelongsTo(User::class, 'user');
    }

    public function address(): BelongsTo
    {
        return $this->BelongsTo(Address::class, 'address');
    }

    public function category(): BelongsTo
    {
        return $this->BelongsTo(Category::class, 'category');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function likedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'place_likes')->withTimestamps();
    }
}
