<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Mail\Contact as MailContact;
use App\Mail\ContactReply;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    /**
     * Display a listing of the resource, most urgent first: reports
     * ("Signaler un lieu") before anything else, then alphabetically by
     * subject, then most recent first within each subject.
     */
    public function index()
    {
        $contacts = Contact::query()
            ->orderByRaw('CASE WHEN subject = ? THEN 0 ELSE 1 END', [Contact::REPORT_SUBJECT])
            ->orderBy('subject')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['status' => 'Success', 'data' => $contacts]);
    }

    public function store(Request $request)
    {
        // Honeypot: a field real users never see or fill (hidden off-screen
        // client-side). Bots that blindly fill every input trip it, so we
        // fake a success response without persisting anything or sending
        // mail — no error is returned, which avoids tipping the bot off.
        if ($request->filled('website')) {
            return response()->json([
                'status' => 'success',
            ]);
        }

        // Form validation
        $request->validate([
            'name' => 'required',
            'email' => 'required|email',
            'subject' => 'required',
            'contenu' => 'required',
        ]);

        $contact = Contact::create([ // Assigne les valeurs saisies dans le formulaire au champs correspondant dans la bd (création de la nouvelle opération)
            'name' => $request->name,
            'email' => $request->email,
            'subject' => $request->subject,
            'contenu' => $request->contenu,
        ]);

        Mail::to('melissa.mangione@gmail.com') // permet définir de qui est envoyé le mail
            ->send(new MailContact($contact));

        return response()->json([
            'status' => 'success',
        ]);
    }

    /**
     * Send a reply to the person who submitted this contact message, and
     * record when it was answered so the admin list can show it as done.
     */
    public function reply(Request $request, Contact $contact)
    {
        $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        Mail::to($contact->email, $contact->name)->send(new ContactReply($contact, $request->message));

        $contact->replied_at = now();
        $contact->save();

        return response()->json(['status' => 'Success', 'data' => $contact]);
    }
}
