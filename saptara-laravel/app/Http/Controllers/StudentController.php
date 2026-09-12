<?php

namespace App\Http\Controllers;

use App\Models\Student;
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
            'avatar'       => 'nullable|string',
            'parent_email' => 'nullable|email',
        ]);

        $exists = Student::where('class_id', $request->class_id)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return response()->json(['error' => "\"{$request->name}\" sudah terdaftar di kelas ini!"], 409);
        }

        $student = Student::create([
            'class_id'     => $request->class_id,
            'name'         => $request->name,
            'avatar'       => $request->avatar ?? '🧒',
            'parent_email' => $request->parent_email,
        ]);

        return response()->json($student, 201);
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

    /** DELETE /api/students/{id} */
    public function destroy(int $id)
    {
        $student = Student::findOrFail($id);
        $name    = $student->name;
        $student->delete();
        return response()->json(['success' => true, 'name' => $name]);
    }
}
