<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class Welcome extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(protected User $user) {}

    public function build()
    {
        return $this->from('noreply@woofalk.com', 'Woofalk')
            ->view('emails.welcome')
            ->subject('Bienvenue sur Woofalk')
            ->with([
                'username' => $this->user->username,
            ]);
    }
}
