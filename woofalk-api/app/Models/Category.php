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
        // The FK column is named "category", not the Eloquent-conventional "category_id".
        return $this->hasMany(Place::class, 'category');
    }

    public function hebergements()
    {
        return $this->hasMany(Hebergement::class, 'category');
    }
}
