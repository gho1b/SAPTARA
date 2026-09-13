<?php

namespace App\Mail;

use App\Models\LogbookEntry;
use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LogbookVerifiedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Student $student,
        public LogbookEntry $entry,
        public ?string $comment = null,
        public ?string $sticker = null
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "⭐ Jurnal Pembiasaan {$this->student->name} Telah Diverifikasi Guru! (SAPTARA)"
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.logbook_verified'
        );
    }
}
