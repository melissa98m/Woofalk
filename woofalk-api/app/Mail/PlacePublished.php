<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PlacePublished extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Takes plain values rather than a Place model: on Place, 'user',
     * 'category' and 'address' are both column names (raw FK ints) and
     * relation names, so magic property access is ambiguous depending on
     * whether the caller eager-loaded or manually overwrote the attribute
     * (see PlaceController::update/bulkUpdateStatus).
     */
    public function __construct(
        protected string $placeName,
        protected ?string $categoryName,
        protected ?string $city,
        protected int $placeId,
    ) {}

    public function build()
    {
        return $this->from('noreply@woofalk.com', 'Woofalk')
            ->view('emails.place-published')
            ->subject('Votre lieu est en ligne - Woofalk')
            ->with([
                'placeName' => $this->placeName,
                'categoryName' => $this->categoryName,
                'city' => $this->city,
                'placeUrl' => 'https://woofalk.com/places/'.$this->placeId,
            ]);
    }
}
