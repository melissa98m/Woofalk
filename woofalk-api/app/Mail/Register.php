<?php
namespace App\Mail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
class Register extends Mailable
{
    use Queueable, SerializesModels;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($user)
    {
        $this->user = $user;
    }
    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->from("melissa.mangione+woofalk@gmail.com")
                    ->view('emails.register')
                    ->subject("Inscription à la plateforme Woofalk")
                    ->with([ //ici j'assigne aux variables les données rentrées dans le formulaire pour les envoyer à la vue
                        'email'=> $this->user->email,
                        'username'=> $this->user->username
                    ]);
    }
}
