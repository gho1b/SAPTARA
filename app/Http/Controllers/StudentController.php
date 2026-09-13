<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\School;
use App\Models\HabitCompletion;
use App\Models\StudentBadge;
use App\Models\StudentAccessory;
use App\Models\Habit;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    /** GET /api/students/{classId} — Daftar siswa dalam kelas */
    public function byClass(int $classId)
    {
        $students = Student::where('class_id', $classId)
            ->orderBy('xp', 'desc')
            ->get()
            ->map(fn($s) => array_merge($s->toArray(), [
                'ship_level'     => $s->ship_level,
                'nautical_miles' => $s->xp,
            ]));

        return response()->json($students);
    }

    /** POST /api/students — Guru: tambah siswa baru */
    public function store(Request $request)
    {
        if (! $request->has('class_id') && $request->has('classId')) {
            $request->merge(['class_id' => $request->classId]);
        }
        if (! $request->has('parent_email') && $request->has('parentEmail')) {
            $request->merge(['parent_email' => $request->parentEmail]);
        }

        $request->validate([
            'class_id'     => 'required|integer|exists:classes,id',
            'name'         => 'required|string|max:255',
            'nis'          => 'nullable|string|max:50',
            'access_code'  => 'nullable|string|max:20',
            'avatar'       => 'nullable|string',
            'parent_email' => 'nullable|email',
        ]);

        $cls = SchoolClass::findOrFail($request->class_id);
        $schoolId = $cls->school_id;

        $exists = Student::where('class_id', $request->class_id)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return response()->json(['error' => "\"{$request->name}\" sudah terdaftar di kelas ini!"], 409);
        }

        $nis = $request->filled('nis') ? trim((string) $request->nis) : null;
        if ($nis && $schoolId) {
            $existsNis = Student::where('school_id', $schoolId)->where('nis', $nis)->exists();
            if ($existsNis) {
                return response()->json(['error' => "Siswa dengan NIS \"{$nis}\" sudah terdaftar di sekolah ini!"], 409);
            }
        } elseif (!$nis) {
            $lastId = Student::max('id') ?? 0;
            $nis = date('Y') . str_pad((string) ($lastId + 1), 4, '0', STR_PAD_LEFT);
            while (Student::where('school_id', $schoolId)->where('nis', $nis)->exists()) {
                $lastId++;
                $nis = date('Y') . str_pad((string) ($lastId + 1), 4, '0', STR_PAD_LEFT);
            }
        }

        $accessCode = $request->filled('access_code')
            ? trim((string) $request->access_code)
            : (string) random_int(100000, 999999);

        $student = Student::create([
            'school_id'    => $schoolId,
            'class_id'     => $request->class_id,
            'name'         => $request->name,
            'nis'          => $nis,
            'access_code'  => $accessCode,
            'avatar'       => $request->avatar ?? '🧒',
            'parent_email' => $request->parent_email,
        ]);

        return response()->json($student, 201);
    }

    /** PUT /api/students/{id} — Guru: update data siswa */
    public function update(Request $request, int $id)
    {
        $student = Student::findOrFail($id);
        $schoolId = $student->school_id;

        $request->validate([
            'name'         => 'sometimes|required|string|max:255',
            'nis'          => 'nullable|string|max:50',
            'access_code'  => 'nullable|string|max:20',
            'avatar'       => 'nullable|string',
            'parent_email' => 'nullable|email',
        ]);

        if ($request->filled('nis') && $schoolId) {
            $nis = trim((string) $request->nis);
            $exists = Student::where('school_id', $schoolId)
                ->where('nis', $nis)
                ->where('id', '!=', $student->id)
                ->exists();
            if ($exists) {
                return response()->json(['error' => "NIS \"{$nis}\" sudah digunakan oleh siswa lain di sekolah ini!"], 409);
            }
            $student->nis = $nis;
        }

        if ($request->filled('name')) {
            $student->name = trim((string) $request->name);
        }
        if ($request->filled('avatar')) {
            $student->avatar = $request->avatar;
        }
        if ($request->has('parent_email')) {
            $student->parent_email = $request->parent_email ?: null;
        }
        if ($request->filled('access_code')) {
            $student->access_code = trim((string) $request->access_code);
        }

        $student->save();

        return response()->json([
            'success' => true,
            'message' => "Data {$student->name} berhasil diperbarui!",
            'student' => $student,
        ]);
    }

    /** GET /api/students/profile/{id} — Detail siswa dengan stats */
    public function show(int $id)
    {
        $student     = Student::with(['badges.habit', 'accessories'])->findOrFail($id);
        $badgeNames  = $student->badges->map(fn($b) => $b->habit?->badge)->filter()->values();
        $accessories = $student->accessories->pluck('accessory_id');

        return response()->json(array_merge($student->toArray(), [
            'ship_level'     => $student->ship_level,
            'nautical_miles' => $student->xp,
            'badge_names'    => $badgeNames,
            'owned_accessories' => $accessories,
        ]));
    }

    /** GET /api/students/{id}/dashboard */
    public function dashboard(int $id)
    {
        $student       = Student::findOrFail($id);
        $today         = Carbon::now('Asia/Jakarta')->toDateString();
        $completedToday = HabitCompletion::where('student_id', $id)
            ->where('date', $today)->count();

        return response()->json([
            'student'        => array_merge($student->toArray(), [
                'ship_level'     => $student->ship_level,
                'nautical_miles' => $student->xp,
            ]),
            'ship_level'     => $student->ship_level,
            'completed_today' => $completedToday,
            'total_habits'   => 7,
            'streak'         => $student->streak,
        ]);
    }

    /** GET /api/students/{id}/weekly — Data mingguan 7 hari terakhir */
    public function weekly(int $id)
    {
        $tz   = 'Asia/Jakarta';
        $days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        $result = [];

        for ($i = 6; $i >= 0; $i--) {
            $date    = Carbon::now($tz)->subDays($i)->toDateString();
            $dayIdx  = (int) Carbon::now($tz)->subDays($i)->format('N') - 1; // 0=Mon
            $count   = HabitCompletion::where('student_id', $id)->where('date', $date)->count();

            $result[] = [
                'day'       => $days[$dayIdx],
                'date'      => $date,
                'completed' => $count,
            ];
        }

        return response()->json($result);
    }

    /** GET /api/students/{id}/compass — Radar chart data (30 hari) */
    public function compass(int $id)
    {
        $since = Carbon::now('Asia/Jakarta')->subDays(30)->toDateString();
        $rows  = HabitCompletion::where('student_id', $id)
            ->where('date', '>=', $since)
            ->selectRaw('habit_id, COUNT(*) as cnt')
            ->groupBy('habit_id')
            ->pluck('cnt', 'habit_id');

        $scores = [];
        for ($i = 1; $i <= 7; $i++) {
            $scores[$i] = (int) round((($rows[$i] ?? 0) / 30) * 100);
        }

        return response()->json($scores);
    }

    /** GET /api/students/{classId}/leaderboard */
    public function leaderboard(int $classId)
    {
        $students = Student::where('class_id', $classId)
            ->orderByDesc('xp')
            ->get()
            ->map(fn($s) => array_merge($s->toArray(), [
                'ship_level'     => $s->ship_level,
                'nautical_miles' => $s->xp,
            ]));

        return response()->json($students);
    }

    /** GET /api/students/{id}/heatmap — Data kalender heatmap 60 hari */
    public function heatmap(int $id)
    {
        $student = Student::findOrFail($id);
        $since = Carbon::today()->subDays(59);

        $completions = HabitCompletion::where('student_id', $id)
            ->where('date', '>=', $since->toDateString())
            ->select('date', DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date');

        $verifiedLogs = \App\Models\LogbookEntry::where('student_id', $id)
            ->where('status', 'verified')
            ->where('date', '>=', $since->toDateString())
            ->select('date', DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date');

        $days = [];
        $curr = clone $since;
        $today = Carbon::today();

        while ($curr->lte($today)) {
            $d = $curr->toDateString();
            $cCount = (int) ($completions[$d] ?? 0);
            $vCount = (int) ($verifiedLogs[$d] ?? 0);

            $days[$d] = [
                'date'         => $d,
                'completions'  => $cCount,
                'verifiedLogs' => $vCount,
                'level'        => min(4, (int) ceil(($cCount / 7) * 4)), // 0 to 4
            ];
            $curr->addDay();
        }

        return response()->json([
            'studentId' => $id,
            'startDate' => $since->toDateString(),
            'endDate'   => $today->toDateString(),
            'days'      => $days,
        ]);
    }

    /** POST /api/students/import — Guru: Import siswa massal dari Excel / CSV */
    public function import(Request $request)
    {
        if (! $request->has('class_id') && $request->has('classId')) {
            $request->merge(['class_id' => $request->classId]);
        }

        $request->validate([
            'class_id' => 'required|integer|exists:classes,id',
            'file'     => 'required|file|max:5120',
        ]);

        $classId = (int) $request->class_id;
        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());

        $rows = [];
        if (in_array($ext, ['csv', 'txt'])) {
            $handle = fopen($file->getRealPath(), 'r');
            while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                if (count($data) === 1 && str_contains($data[0], ';')) {
                    $data = str_getcsv($data[0], ';');
                }
                $rows[] = $data;
            }
            fclose($handle);
        } else {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();
        }

        if (empty($rows)) {
            return response()->json(['error' => 'Berkas kosong atau tidak dapat dibaca'], 422);
        }

        $firstRow = array_map(fn($v) => strtolower(trim((string)$v)), $rows[0]);
        $startIndex = 0;
        $hasNisColumn = false;
        if (str_contains($firstRow[0] ?? '', 'nama') || str_contains($firstRow[0] ?? '', 'name')) {
            $startIndex = 1;
            $hasNisColumn = str_contains($firstRow[1] ?? '', 'nis');
        }

        $cls = SchoolClass::find($classId);
        $schoolId = $cls ? $cls->school_id : null;

        $imported = [];
        $skipped = [];
        $defaultAvatars = ["🧒", "👧", "👦", "🧒🏻", "👧🏻", "👦🏻", "🧑‍🦱", "👩‍🦰", "🧑‍🎓"];
        $lastStudentId = Student::max('id') ?? 0;

        for ($i = $startIndex; $i < count($rows); $i++) {
            $row = $rows[$i];
            $name = trim((string)($row[0] ?? ''));
            if ($name === '') {
                continue;
            }

            if ($hasNisColumn) {
                $nis = trim((string)($row[1] ?? ''));
                $avatar = trim((string)($row[2] ?? ''));
                $parentEmail = trim((string)($row[3] ?? ''));
                $accessCode = trim((string)($row[4] ?? ''));
            } else {
                $nis = '';
                $avatar = trim((string)($row[1] ?? ''));
                $parentEmail = trim((string)($row[2] ?? ''));
                $accessCode = '';
            }

            if (!$avatar || mb_strlen($avatar) > 4) {
                $avatar = $defaultAvatars[$i % count($defaultAvatars)];
            }

            if ($parentEmail !== '' && !filter_var($parentEmail, FILTER_VALIDATE_EMAIL)) {
                $parentEmail = null;
            }

            // NIS handling
            if ($nis !== '') {
                if ($schoolId && Student::where('school_id', $schoolId)->where('nis', $nis)->exists()) {
                    $skipped[] = "$name (NIS $nis sudah terdaftar)";
                    continue;
                }
            } else {
                $lastStudentId++;
                $nis = date('Y') . str_pad((string)$lastStudentId, 4, '0', STR_PAD_LEFT);
                while ($schoolId && Student::where('school_id', $schoolId)->where('nis', $nis)->exists()) {
                    $lastStudentId++;
                    $nis = date('Y') . str_pad((string)$lastStudentId, 4, '0', STR_PAD_LEFT);
                }
            }

            // PIN handling
            if ($accessCode === '') {
                $accessCode = (string) random_int(100000, 999999);
            }

            $exists = Student::where('class_id', $classId)
                ->where('name', $name)
                ->exists();

            if ($exists) {
                $skipped[] = "$name (sudah terdaftar)";
                continue;
            }

            $student = Student::create([
                'school_id'    => $schoolId,
                'class_id'     => $classId,
                'name'         => $name,
                'nis'          => $nis,
                'access_code'  => $accessCode,
                'avatar'       => $avatar,
                'parent_email' => $parentEmail ?: null,
            ]);

            $imported[] = $student;
        }

        return response()->json([
            'success'  => true,
            'imported' => count($imported),
            'skipped'  => $skipped,
            'students' => $imported,
        ]);
    }

    /** GET /api/students/template — Unduh template CSV/Excel import siswa */
    public function downloadTemplate()
    {
        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="template_import_siswa_saptara.csv"',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM
            fputcsv($handle, ['Nama Siswa', 'NIS', 'Avatar', 'Email Orang Tua', 'Kode PIN (Opsional)']);
            fputcsv($handle, ['Ahmad Dahlan', '10001', '👦', 'ortu.ahmad@gmail.com', '123456']);
            fputcsv($handle, ['Siti Fatimah', '10002', '👧', 'ortu.siti@gmail.com', '654321']);
            fputcsv($handle, ['Raden Mas Joko', '', '🧒', '', '']);
            fclose($handle);
        }, 200, $headers);
    }

    /** DELETE /api/students/{id} */
    public function destroy(int $id)
    {
        $student = Student::findOrFail($id);
        $name    = $student->name;
        $student->delete();
        return response()->json(['success' => true, 'name' => $name]);
    }

    /** PATCH /api/students/{id}/reset-code — Guru reset/ubah kode akses siswa */
    public function resetCode(Request $request, int $id)
    {
        $student = Student::findOrFail($id);

        $newCode = $request->filled('access_code')
            ? trim((string) $request->access_code)
            : (string) random_int(100000, 999999);

        $student->update(['access_code' => $newCode]);

        return response()->json([
            'success'     => true,
            'message'     => "Kode unik untuk {$student->name} berhasil diperbarui!",
            'access_code' => $newCode,
            'student'     => $student,
        ]);
    }
}
