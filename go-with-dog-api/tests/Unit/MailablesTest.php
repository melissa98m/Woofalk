<?php

namespace Tests\Unit;

use App\Mail\Contact as MailContact;
use App\Mail\ContactReply;
use App\Mail\ResetPasswordEmail;
use App\Models\Contact;
use Tests\TestCase;

class MailablesTest extends TestCase
{
    public function test_contact_mail_builds_with_submitted_data(): void
    {
        $contact = new Contact([
            'name' => 'Zoé',
            'email' => 'zoe@example.com',
            'subject' => 'Autre',
            'contenu' => 'Bonjour !',
        ]);

        $mail = (new MailContact($contact))->build();

        $mail->assertHasSubject('Message provenant de la plateforme Go with dog');
        $mail->assertSeeInHtml('Zoé');
        $mail->assertSeeInHtml('Bonjour !');
    }

    public function test_contact_reply_mail_builds_with_original_message_and_reply(): void
    {
        $contact = new Contact([
            'name' => 'Zoé',
            'email' => 'zoe@example.com',
            'subject' => 'Autre',
            'contenu' => 'Message original',
        ]);

        $mail = (new ContactReply($contact, 'Voici notre réponse'))->build();

        $mail->assertHasSubject('Réponse à votre message - Go with dog');
        $mail->assertSeeInHtml('Message original');
        $mail->assertSeeInHtml('Voici notre réponse');
    }

    public function test_reset_password_mail_includes_the_reset_link(): void
    {
        $mail = (new ResetPasswordEmail('some-token'))->build();

        $mail->assertHasSubject('Réinitialisation de mot de passe');
        $mail->assertSeeInHtml('some-token');
    }
}
