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
}
