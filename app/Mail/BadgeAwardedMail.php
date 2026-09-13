<?php

namespace App\Mail;

use App\Models\Habit;
use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BadgeAwardedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Student $student,
        public Habit $habit
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "🎖️ Selamat! {$this->student->name} Meraih Piagam Kebiasaan {$this->habit->name} (SAPTARA)"
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.badge_awarded'
        );
    }
}
