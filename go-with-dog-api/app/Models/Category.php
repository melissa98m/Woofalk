<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['category_name', 'scope'];

    public function places()
    {
        return $this->hasMany(Place::class);
    }

    public function hebergements()
    {
        return $this->hasMany(Hebergement::class);
    }
}
