<?php

namespace App\Mail;

use App\Models\Contact;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(protected Contact $contact) {}

    public function build()
    {
        return $this->from('contact@woofalk.com', 'Woofalk')
            ->view('emails.contact-confirmation')
            ->subject('Votre message a bien été reçu - Woofalk')
            ->with([
                'subject' => $this->contact->subject,
                'contenu' => $this->contact->contenu,
            ]);
    }
}
