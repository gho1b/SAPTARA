<?php

namespace App\Http\Controllers;

use App\Mail\LogbookVerifiedMail;
use App\Models\HabitCompletion;
use App\Models\LogbookEntry;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LogbookController extends Controller
{
    /** POST /api/logbook — Siswa submit entri logbook */
    public function store(Request $request)
    {
        if (! $request->has('habit_id') && $request->has('habitId')) {
            $request->merge(['habit_id' => $request->habitId]);
        }

        $request->validate([
            'habit_id' => 'required|integer|exists:habits,id',
            'caption' => 'required|string',
            'photo' => 'nullable|image|max:10240',
        ]);

        $studentId = $request->_student_id;
        $now = Carbon::now('Asia/Jakarta');
        $today = $now->toDateString();

        $photoUrl = null;
        if ($request->hasFile('photo')) {
            $photoUrl = $this->processAndStorePhoto($request->file('photo'));
        }

        $entry = LogbookEntry::create([
            'student_id' => $studentId,
            'habit_id' => $request->habit_id,
            'date' => $today,
            'time' => $now->toTimeString(),
            'photo_url' => $photoUrl,
            'caption' => $request->caption,
            'status' => 'pending',
        ]);

        // Mark habit as completed for today if not already
        $exists = HabitCompletion::where('student_id', $studentId)
            ->where('habit_id', $request->habit_id)
            ->where('date', $today)
            ->exists();

        if (! $exists) {
            HabitCompletion::create([
                'student_id' => $studentId,
                'habit_id' => $request->habit_id,
                'date' => $today,
            ]);
            $student = Student::find($studentId);
            if ($student) {
                $student->increment('xp', 10);
                $student->increment('coins', 5);
                $student->recordDailyActivity($today);
            }
        } else {
            // Jika habit completion sudah ada hari ini tapi siswa baru mengunggah logbook,
            // pastikan aktivitas harian tetap tercatat jika belum
            $student = Student::find($studentId);
            $student?->recordDailyActivity($today);
        }

        return response()->json($entry->load(['habit', 'student']), 201);
    }

    /**
     * Memproses dan menyimpan foto logbook dengan ukuran tepat 960 x 1280 piksel (rasio 3:4 Portrait).
     * Mendukung foto input baik dari device mode landscape maupun portrait, serta rotasi EXIF.
     */
    private function processAndStorePhoto($file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $filename = 'logbook_'.Str::random(24).'.jpg';

        $diskName = config('filesystems.logbook_disk', 'r2');
        $directory = trim((string) config('filesystems.logbook_directory', 'logbook'), '/');
        $destinationRelative = $directory !== '' ? $directory.'/'.$filename : $filename;
        $disk = Storage::disk($diskName);

        // Jika ekstensi GD tidak aktif, simpan file secara langsung
        if (! extension_loaded('gd')) {
            $path = $file->store($directory, $diskName);

            return $disk->url($path);
        }

        $realPath = $file->getRealPath();
        $source = null;
        $mime = $file->getMimeType() ?: (file_exists($realPath) ? mime_content_type($realPath) : null);

        if (str_contains($mime, 'jpeg') || str_contains($mime, 'jpg') || in_array($extension, ['jpg', 'jpeg'])) {
            $source = @imagecreatefromjpeg($realPath);
        } elseif (str_contains($mime, 'png') || $extension === 'png') {
            $source = @imagecreatefrompng($realPath);
        } elseif (str_contains($mime, 'webp') || $extension === 'webp') {
            $source = @imagecreatefromwebp($realPath);
        }

        if (! $source) {
            $path = $file->store($directory, $diskName);

            return $disk->url($path);
        }

        // Tangani EXIF Orientation untuk JPEG dari smartphone
        if (function_exists('exif_read_data') && ($extension === 'jpg' || $extension === 'jpeg')) {
            $exif = @exif_read_data($realPath);
            if ($exif && ! empty($exif['Orientation'])) {
                switch ($exif['Orientation']) {
                    case 3:
                        $rotated = imagerotate($source, 180, 0);
                        imagedestroy($source);
                        $source = $rotated;
                        break;
                    case 6:
                        $rotated = imagerotate($source, -90, 0);
                        imagedestroy($source);
                        $source = $rotated;
                        break;
                    case 8:
                        $rotated = imagerotate($source, 90, 0);
                        imagedestroy($source);
                        $source = $rotated;
                        break;
                }
            }
        }

        $origW = imagesx($source);
        $origH = imagesy($source);

        // Target: 960 x 1280 (rasio 3:4 = 0.75)
        $targetW = 960;
        $targetH = 1280;
        $targetRatio = $targetW / $targetH;
        $currentRatio = $origW / $origH;

        if ($origW === $targetW && $origH === $targetH) {
            $canvas = $source;
        } else {
            if ($currentRatio > $targetRatio) {
                // Foto landscape atau lebih lebar dari 3:4 -> crop horizontal (tengah)
                $srcH = $origH;
                $srcW = (int) round($origH * $targetRatio);
                $srcX = (int) round(($origW - $srcW) / 2);
                $srcY = 0;
            } else {
                // Foto lebih tinggi dari 3:4 -> crop vertikal (tengah)
                $srcW = $origW;
                $srcH = (int) round($origW / $targetRatio);
                $srcX = 0;
                $srcY = (int) round(($origH - $srcH) / 2);
            }

            $canvas = imagecreatetruecolor($targetW, $targetH);
            imagecopyresampled($canvas, $source, 0, 0, $srcX, $srcY, $targetW, $targetH, $srcW, $srcH);
            imagedestroy($source);
        }

        ob_start();
        imagejpeg($canvas, null, 88);
        $imageData = ob_get_clean();
        imagedestroy($canvas);

        $disk->put($destinationRelative, $imageData, 'public');

        return $disk->url($destinationRelative);
    }

    /** GET /api/logbook/student/{studentId} */
    public function byStudent(int $studentId)
    {
        $entries = LogbookEntry::with('habit')
            ->where('student_id', $studentId)
            ->latest()
            ->get()
            ->map(fn ($e) => array_merge($e->toArray(), [
                'habit_name' => $e->habit?->name,
                'habit_icon' => $e->habit?->icon,
            ]));

        return response()->json($entries);
    }

    /** GET /api/logbook/class/{classId} — Feed kelas (guru/ortu) */
    public function byClass(int $classId)
    {
        $studentIds = Student::where('class_id', $classId)->pluck('id');

        if ($studentIds->isEmpty()) {
            return response()->json([]);
        }

        $entries = LogbookEntry::with(['student', 'habit'])
            ->whereIn('student_id', $studentIds)
            ->latest()
            ->get()
            ->map(fn ($e) => array_merge($e->toArray(), [
                'student_name' => $e->student?->name,
                'student_avatar' => $e->student?->avatar,
                'habit_name' => $e->habit?->name,
                'habit_icon' => $e->habit?->icon,
            ]));

        return response()->json($entries);
    }

    /** GET /api/logbook/pending/{classId} */
    public function pending(int $classId)
    {
        $studentIds = Student::where('class_id', $classId)->pluck('id');

        $entries = LogbookEntry::with(['student', 'habit'])
            ->whereIn('student_id', $studentIds)
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(fn ($e) => array_merge($e->toArray(), [
                'student_name' => $e->student?->name,
                'student_avatar' => $e->student?->avatar,
                'habit_name' => $e->habit?->name,
                'habit_icon' => $e->habit?->icon,
            ]));

        return response()->json($entries);
    }

    /** PATCH /api/logbook/{id}/verify — Guru approve */
    public function verify(Request $request, int $id)
    {
        $request->validate([
            'sticker' => 'nullable|string',
            'comment' => 'nullable|string',
        ]);

        $entry = LogbookEntry::findOrFail($id);
        $xpReward = 15;

        $entry->update([
            'status' => 'verified',
            'reviewed_by_teacher_id' => $request->_teacher->id,
            'teacher_sticker' => $request->sticker ?? '🪹',
            'teacher_comment' => $request->comment ?? 'Bagus, Kapten!',
            'xp_earned' => $xpReward,
        ]);

        Student::where('id', $entry->student_id)->increment('xp', $xpReward);

        // Notifikasi email otomatis ke orang tua jika parent_email tersedia
        try {
            $student = Student::with('class')->find($entry->student_id);
            if ($student && ! empty($student->parent_email)) {
                Mail::to($student->parent_email)->send(
                    new LogbookVerifiedMail(
                        $student,
                        $entry->load('habit'),
                        $request->comment ?? 'Bagus, Kapten!',
                        $request->sticker ?? '🪹'
                    )
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Gagal mengirim email verifikasi logbook: '.$e->getMessage());
        }

        return response()->json($entry->fresh());
    }

    /** PATCH /api/logbook/{id}/reject — Guru reject */
    public function reject(Request $request, int $id)
    {
        $request->validate(['comment' => 'nullable|string']);

        $entry = LogbookEntry::findOrFail($id);

        $entry->update([
            'status' => 'needs_revision',
            'reviewed_by_teacher_id' => $request->_teacher->id,
            'teacher_comment' => $request->comment ?? 'Coba lagi ya, Kapten!',
        ]);

        return response()->json($entry->fresh());
    }

    /** POST /api/logbook/batch-verify */
    public function batchVerify(Request $request)
    {
        if (! $request->has('entry_ids') && $request->has('entryIds')) {
            $request->merge(['entry_ids' => $request->entryIds]);
        }

        $request->validate([
            'entry_ids' => 'required|array',
            'sticker' => 'nullable|string',
            'comment' => 'nullable|string',
        ]);

        $results = [];
        foreach ($request->entry_ids as $entryId) {
            $entry = LogbookEntry::find($entryId);
            if (! $entry) {
                continue;
            }

            $xpReward = 15;
            $entry->update([
                'status' => 'verified',
                'reviewed_by_teacher_id' => $request->_teacher->id,
                'teacher_sticker' => $request->sticker ?? '👍',
                'teacher_comment' => $request->comment ?? 'Bagus, Kapten! Lanjutkan!',
                'xp_earned' => $xpReward,
            ]);
            Student::where('id', $entry->student_id)->increment('xp', $xpReward);
            $results[] = $entry->fresh();
        }

        return response()->json(['verified' => count($results), 'entries' => $results]);
    }

    /** POST /api/logbook/{id}/parent-comment */
    public function addParentComment(Request $request, int $id)
    {
        $request->validate(['comment' => 'required|string|min:1']);

        $entry = LogbookEntry::findOrFail($id);
        $entry->update(['parent_comment' => trim($request->comment)]);

        return response()->json($entry->fresh());
    }
}
