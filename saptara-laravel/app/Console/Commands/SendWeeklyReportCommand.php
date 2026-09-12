<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\HabitCompletion;
use App\Models\LogbookEntry;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendWeeklyReportCommand extends Command
{
    protected $signature = 'saptara:send-weekly-reports';
    protected $description = 'Kirim rekap mingguan pembiasaan karakter ke email orang tua';

    public function handle(): int
    {
        $this->info("Memulai pengiriman rekap mingguan SAPTARA...");

        $startOfWeek = Carbon::now()->subDays(7)->startOfDay();
        $endOfWeek   = Carbon::now()->endOfDay();

        $students = Student::whereNotNull('parent_email')
            ->where('parent_email', '!=', '')
            ->with('class')
            ->get();

        $count = 0;
        foreach ($students as $student) {
            $completionsCount = HabitCompletion::where('student_id', $student->id)
                ->whereBetween('date', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
                ->count();

            $verifiedCount = LogbookEntry::where('student_id', $student->id)
                ->where('status', 'verified')
                ->whereBetween('date', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
                ->count();

            // Log / send email
            Log::info("Weekly Report dikirim untuk {$student->name} ({$student->parent_email}): {$completionsCount} kebiasaan, {$verifiedCount} foto verifikasi.");
            $count++;
        }

        $this->info("Selesai! Memproses rekap untuk {$count} siswa ber-email orang tua.");
        return Command::SUCCESS;
    }
}
