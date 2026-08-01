<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'roles',
        'terms_accepted_at',
        'google_id',
    ];

    public function places()
    {
        // The FK column is named "user", not the Eloquent-conventional "user_id".
        return $this->hasMany(Place::class, 'user');
    }

    public function ballades()
    {
        return $this->hasMany(Ballade::class, 'user');
    }

    public function likedPlaces()
    {
        return $this->belongsToMany(Place::class, 'place_likes')->withTimestamps();
    }

    public function likedBallades()
    {
        return $this->belongsToMany(Ballade::class, 'ballade_likes')->withTimestamps();
    }

    public function hebergements()
    {
        return $this->hasMany(Hebergement::class, 'user');
    }

    public function likedHebergements()
    {
        return $this->belongsToMany(Hebergement::class, 'hebergement_likes')->withTimestamps();
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'terms_accepted_at' => 'datetime',
    ];

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [
            'roles' => $this->roles,
            'username' => $this->username,
            'email' => $this->email,
        ];
    }
}
