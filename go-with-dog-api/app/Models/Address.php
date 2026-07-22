<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    use HasFactory;
    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];
    protected $fillable = [
        'address',
        'postal_code',
        'city',
        'latitude' ,
        'longitude'];

    public function places()
    {
        return $this->hasMany(Place::class);
    }
}
