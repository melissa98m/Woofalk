<?php

use App\Models\Contact;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ContactTest extends TestCase
{
    use DatabaseTransactions;

    #[Test]
    public function it_can_create_a_new_contact()
    {
        $data = [
            'email' => 'john.doe@example.com',
            'subject' => 'Test Subject',
            'contenu' => 'Test Content',
        ];

        $contact = Contact::create($data);

        $this->assertInstanceOf(Contact::class, $contact);
        $this->assertEquals($data['email'], $contact->email);
        $this->assertEquals($data['subject'], $contact->subject);
        $this->assertEquals($data['contenu'], $contact->contenu);
    }
}
