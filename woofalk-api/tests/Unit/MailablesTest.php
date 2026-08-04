<?php

namespace Tests\Unit;

use App\Mail\Contact as MailContact;
use App\Mail\ContactConfirmation;
use App\Mail\ContactReply;
use App\Mail\PlacePublished;
use App\Mail\ResetPasswordEmail;
use App\Mail\Welcome;
use App\Models\Contact;
use App\Models\User;
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

        $mail->assertHasSubject('Message provenant de la plateforme Woofalk');
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

        $mail->assertHasSubject('Réponse à votre message - Woofalk');
        $mail->assertSeeInHtml('Message original');
        $mail->assertSeeInHtml('Voici notre réponse');
    }

    public function test_reset_password_mail_includes_the_reset_link(): void
    {
        $mail = (new ResetPasswordEmail('some-token'))->build();

        $mail->assertHasSubject('Réinitialisation de mot de passe');
        $mail->assertSeeInHtml('some-token');
    }

    public function test_welcome_mail_greets_the_new_user(): void
    {
        $user = new User(['username' => 'Zoé', 'email' => 'zoe@example.com']);

        $mail = (new Welcome($user))->build();

        $mail->assertHasSubject('Bienvenue sur Woofalk');
        $mail->assertSeeInHtml('Zoé');
    }

    public function test_contact_confirmation_mail_recaps_the_submitted_message(): void
    {
        $contact = new Contact([
            'name' => 'Zoé',
            'email' => 'zoe@example.com',
            'subject' => 'Autre',
            'contenu' => 'Bonjour !',
        ]);

        $mail = (new ContactConfirmation($contact))->build();

        $mail->assertHasSubject('Votre message a bien été reçu - Woofalk');
        $mail->assertSeeInHtml('Autre');
        $mail->assertSeeInHtml('Bonjour !');
    }

    public function test_place_published_mail_includes_the_place_details_and_link(): void
    {
        $mail = (new PlacePublished('Parc canin des Buttes-Chaumont', 'Parc', 'Paris', 42))->build();

        $mail->assertHasSubject('Votre lieu est en ligne - Woofalk');
        $mail->assertSeeInHtml('Parc canin des Buttes-Chaumont');
        $mail->assertSeeInHtml('Paris');
        $mail->assertSeeInHtml('https://woofalk.com/places/42');
    }
}
