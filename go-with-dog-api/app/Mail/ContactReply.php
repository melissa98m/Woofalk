<?php

namespace App\Mail;

use App\Models\Contact;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactReply extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(protected Contact $contact, protected string $message) {}

    public function build()
    {
        return $this->from('melissa.mangione+supportGowithdog@gmail.com', 'Go with dog')
            ->view('emails.contact-reply')
            ->subject('Réponse à votre message - Go with dog')
            ->with([
                'name' => $this->contact->name,
                'originalSubject' => $this->contact->subject,
                'originalMessage' => $this->contact->contenu,
                'reply' => $this->message,
            ]);
    }
}
