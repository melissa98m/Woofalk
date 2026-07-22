<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Place extends Model
{
    use HasFactory;
    protected $fillable = [
        'place_name' ,
        'place_description',
        'place_image',
        'user',
        'address',
        'category',
        'status'
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
}
