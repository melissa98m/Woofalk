<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class Contact extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($contact)
    {
        $this->contact = $contact;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->from('melissa.mangione+supportGowithdog@gmail.com')
            ->view('emails.contact')
            ->subject('Message provenant de la plateforme Go with dog')
            ->with([ // ici j'assigne aux variables les données rentrées dans le formulaire pour les envoyer à la vue
                'name' => $this->contact->name,
                'email' => $this->contact->email,
                'subject' => $this->contact->subject,
                'contenu' => $this->contact->contenu,
            ]);
    }
}
