<?php

namespace App\Http\Controllers;

use App\Models\Habit;
use App\Models\HabitCompletion;
use App\Models\LogbookEntry;
use App\Models\SchoolClass;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Cetak Raport Karakter Siswa (PDF A4 Portrait)
     * GET /api/reports/student/{id}/pdf
     */
    public function exportStudentPdf(Request $request, int $id)
    {
        $student = Student::with(['class.teacher', 'badges.habit'])->findOrFail($id);
        $class = $student->class;
        $teacher = $class->teacher;
        $habits = Habit::orderBy('id')->get();

        // Hitung statistik per habit untuk siswa ini
        $habitStats = [];
        foreach ($habits as $h) {
            $completionsCount = HabitCompletion::where('student_id', $student->id)
                ->where('habit_id', $h->id)
                ->count();

            $verifiedLogsCount = LogbookEntry::where('student_id', $student->id)
                ->where('habit_id', $h->id)
                ->where('status', 'verified')
                ->count();

            $habitStats[$h->id] = [
                'completions' => $completionsCount,
                'verified_logs' => $verifiedLogsCount,
            ];
        }

        $verifiedLogbooksCount = LogbookEntry::where('student_id', $student->id)
            ->where('status', 'verified')
            ->count();

        $pdf = Pdf::loadView('reports.student_raport', [
            'student' => $student,
            'class' => $class,
            'teacher' => $teacher,
            'habits' => $habits,
            'habitStats' => $habitStats,
            'verifiedLogbooksCount' => $verifiedLogbooksCount,
            'badges' => $student->badges,
        ])->setPaper('a4', 'portrait');

        $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $student->name);

        return $pdf->download("Raport_SAPTARA_{$safeName}.pdf");
    }

    /**
     * Cetak Rekapitulasi Karakter Kelas (PDF A4 Landscape)
     * GET /api/reports/class/{id}/pdf
     */
    public function exportClassPdf(Request $request, int $id)
    {
        $class = SchoolClass::with('teacher')->findOrFail($id);
        $students = Student::where('class_id', $id)
            ->withCount([
                'habitCompletions as completions_count',
                'badges as badges_count',
                'logbookEntries as verified_logs_count' => function ($q) {
                    $q->where('status', 'verified');
                },
            ])
            ->orderBy('name')
            ->get();

        $pdf = Pdf::loadView('reports.class_summary', [
            'class' => $class,
            'teacher' => $class->teacher,
            'students' => $students,
        ])->setPaper('a4', 'landscape');

        $safeClassCode = preg_replace('/[^A-Za-z0-9_\-]/', '_', $class->class_code ?? 'Kelas');

        return $pdf->download("Rekap_SAPTARA_{$safeClassCode}.pdf");
    }

    /**
     * Unduh Rekap Data Siswa Kelas format Excel / CSV
     * GET /api/reports/class/{id}/excel
     */
    public function exportClassExcel(Request $request, int $id): StreamedResponse
    {
        $class = SchoolClass::with('teacher')->findOrFail($id);
        $students = Student::where('class_id', $id)
            ->withCount([
                'habitCompletions as completions_count',
                'badges as badges_count',
                'logbookEntries as verified_logs_count' => function ($q) {
                    $q->where('status', 'verified');
                },
            ])
            ->orderBy('name')
            ->get();

        $safeClassCode = preg_replace('/[^A-Za-z0-9_\-]/', '_', $class->class_code ?? 'Kelas');
        $filename = "Rekap_Kelas_{$safeClassCode}_".date('Ymd').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($class, $students) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Microsoft Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Title & Info
            fputcsv($handle, ['REKAPITULASI PELAYARAN KARAKTER SISWA (SAPTARA)']);
            fputcsv($handle, ['Sekolah', $class->school_name ?? $class->schoolName]);
            fputcsv($handle, ['Kelas', $class->class_code ?? $class->classCode]);
            fputcsv($handle, ['Kapal', $class->ship_name ?? $class->shipName ?? 'Saptara']);
            fputcsv($handle, ['Guru Pembina', $class->teacher?->display_name ?? 'Guru Kelas']);
            fputcsv($handle, ['Tanggal Ekspor', date('d/m/Y H:i').' WIB']);
            fputcsv($handle, []); // Empty row

            // Table Headers
            fputcsv($handle, [
                'No',
                'Nama Siswa',
                'Email Ortu',
                'Level Kapal',
                'Mil Pelayaran (XP)',
                'Koin',
                'Streak (Hari)',
                'Ceklis Habit Selesai',
                'Jurnal Foto Terverifikasi',
                'Lencana Diraih',
                'Status Keaktifan',
            ]);

            // Data Rows
            foreach ($students as $index => $s) {
                $status = ($s->streak ?? 0) >= 3 ? 'Sangat Aktif' : (($s->streak ?? 0) >= 1 ? 'Aktif' : 'Perlu Dorongan');

                fputcsv($handle, [
                    $index + 1,
                    $s->name,
                    $s->parent_email ?? '-',
                    $s->ship_level['name'] ?? 'Pelaut Pemula',
                    $s->xp ?? 0,
                    $s->coins ?? 0,
                    $s->streak ?? 0,
                    $s->completions_count ?? 0,
                    $s->verified_logs_count ?? 0,
                    $s->badges_count ?? 0,
                    $status,
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
