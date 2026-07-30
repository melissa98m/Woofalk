<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    use HasFactory;

    // The subject value used by the public contact form (contact.jsx) to
    // report a place — flagged as priority in the admin messages list.
    public const REPORT_SUBJECT = 'Signaler un lieu';

    protected $fillable = ['name', 'email', 'subject', 'contenu'];

    protected $casts = ['replied_at' => 'datetime'];

    protected $appends = ['is_report'];

    public function getIsReportAttribute(): bool
    {
        return $this->subject === self::REPORT_SUBJECT;
    }
}
