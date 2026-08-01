<?php

namespace App\Providers;

use App\Services\Auth\GoogleTokenVerifier;
use App\Services\Auth\GoogleTokenVerifierContract;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\Mailer\Bridge\Mailjet\Transport\MailjetTransportFactory;
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

        Mail::extend('mailjet', function () {
            $credentials = Config::get('services.mailjet', []);

            return (new MailjetTransportFactory)->create(
                new Dsn('mailjet+api', 'default', $credentials['key'] ?? null, $credentials['secret'] ?? null)
            );
        });
    }
}
