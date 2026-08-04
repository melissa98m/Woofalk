<?php

namespace App\Providers;

use App\Services\Auth\GoogleTokenVerifier;
use App\Services\Auth\GoogleTokenVerifierContract;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\Mailer\Bridge\Resend\Transport\ResendTransportFactory;
use Symfony\Component\Mailer\Transport\Dsn;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->bind(GoogleTokenVerifierContract::class, GoogleTokenVerifier::class);
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        Schema::defaultStringLength(191);

        Mail::extend('resend', function () {
            $credentials = Config::get('services.resend', []);

            return (new ResendTransportFactory)->create(
                new Dsn('resend+api', 'default', $credentials['key'] ?? null)
            );
        });
    }
}
