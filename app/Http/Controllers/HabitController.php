<?php

namespace App\Http\Controllers;

use App\Models\Habit;
use App\Models\HabitCompletion;
use App\Models\LogbookEntry;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;

class HabitController extends Controller
{
    /** GET /api/habits — Semua habit (global + custom untuk kelas) */
    public function index(Request $request)
    {
        $classId = $request->query('class_id');

        $query = $classId
            ? Habit::forClass((int) $classId)
            : Habit::global();

        $habits = $query->withCount(['completions', 'logbookEntries'])->get();

        return response()->json($habits);
    }

    /** GET /api/habits/missions/{studentId} — Misi hari ini (termasuk custom habit kelas) */
    public function todayMissions(int $studentId)
    {
        $student = Student::find($studentId);
        $today = Carbon::now('Asia/Jakarta')->toDateString();

        $habits = ($student && $student->class_id)
            ? Habit::forClass($student->class_id)->get()
            : Habit::global()->get();

        $doneIds = HabitCompletion::where('student_id', $studentId)
            ->where('date', $today)
            ->pluck('habit_id');

        $missions = $habits->map(fn ($h) => [
            'habit' => $h,
            'completed' => $doneIds->contains($h->id),
        ]);

        return response()->json($missions);
    }

    /** POST /api/habits/toggle — Toggle penyelesaian habit hari ini */
    public function toggle(Request $request)
    {
        $request->validate(['habit_id' => 'required|integer|exists:habits,id']);

        $studentId = $request->_student_id;
        $habitId = $request->habit_id;
        $today = Carbon::now('Asia/Jakarta')->toDateString();

        $existing = HabitCompletion::where('student_id', $studentId)
            ->where('habit_id', $habitId)
            ->where('date', $today)
            ->first();

        if ($existing) {
            // Batalkan penyelesaian
            $existing->delete();
            Student::where('id', $studentId)->decrement('xp', 10);
            Student::where('id', $studentId)->decrement('coins', 5);

            return response()->json(['action' => 'uncompleted', 'habit_id' => $habitId]);
        }

        // Catat penyelesaian
        HabitCompletion::create([
            'student_id' => $studentId,
            'habit_id' => $habitId,
            'date' => $today,
        ]);

        $student = Student::find($studentId);
        $student->increment('xp', 10);
        $student->increment('coins', 5);

        // Update streak & cek milestone reward
        $milestoneReward = $this->updateStreakAndCheckMilestone($student, $today);

        return response()->json([
            'action' => 'completed',
            'habit_id' => $habitId,
            'streak' => $student->streak,
            'milestoneReward' => $milestoneReward,
        ]);
    }

    /** POST /api/habits — Guru membuat kebiasaan khusus kelas */
    public function store(Request $request)
    {
        if (! $request->has('class_id') && $request->has('classId')) {
            $request->merge(['class_id' => $request->classId]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'island' => 'nullable|string|max:100',
            'class_id' => 'required|integer|exists:classes,id',
        ]);

        $teacherId = $request->_teacher?->id;

        $habit = Habit::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? 'Kebiasaan khusus kelas',
            'icon' => $validated['icon'] ?? '⭐',
            'island' => $validated['island'] ?? 'Pulau Karakter Mandiri',
            'badge' => $validated['name'],
            'badge_icon' => $validated['icon'] ?? '⭐',
            'color' => '#0284c7',
            'position_x' => rand(20, 80),
            'position_y' => rand(20, 80),
            'is_custom' => true,
            'created_by_teacher_id' => $teacherId,
            'class_id' => $validated['class_id'],
        ]);

        return response()->json([
            'message' => 'Kebiasaan kelas berhasil ditambahkan',
            'habit' => $habit,
        ], 201);
    }

    /** PUT /api/habits/{id} — Guru mengedit kebiasaan (nama, deskripsi, ikon, pulau) */
    public function update(Request $request, int $id)
    {
        $habit = Habit::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'island' => 'nullable|string|max:100',
        ]);

        $habit->name = $validated['name'];
        if (array_key_exists('description', $validated)) {
            $habit->description = $validated['description'] ?? '';
        }
        if (! empty($validated['icon'])) {
            $habit->icon = $validated['icon'];
            $habit->badge_icon = $validated['icon'];
        }
        if (! empty($validated['island'])) {
            $habit->island = $validated['island'];
        }
        $habit->save();

        return response()->json([
            'message' => 'Kebiasaan berhasil diperbarui',
            'habit' => $habit,
        ]);
    }

    /** DELETE /api/habits/{id} — Guru menghapus kebiasaan khusus kelas (hanya jika belum pernah diisi) */
    public function destroy(Request $request, int $id)
    {
        $habit = Habit::findOrFail($id);

        if (! $habit->is_custom) {
            return response()->json(['error' => '7 Kebiasaan pokok Sapta Tara tidak dapat dihapus.'], 403);
        }

        $completionsCount = HabitCompletion::where('habit_id', $habit->id)->count();
        $logbooksCount = LogbookEntry::where('habit_id', $habit->id)->count();

        if ($completionsCount > 0 || $logbooksCount > 0) {
            return response()->json([
                'error' => "Kebiasaan ini sudah pernah diisi oleh siswa ({$completionsCount} checklist, {$logbooksCount} jurnal foto) sehingga tidak dapat dihapus agar riwayat siswa tidak rusak. Anda dapat mengedit nama atau keterangannya.",
            ], 422);
        }

        $habit->delete();

        return response()->json(['message' => 'Kebiasaan kelas berhasil dihapus']);
    }

    /**
     * Hitung streak & cek apakah menyentuh milestone 7, 14, atau 30 hari
     */
    private function updateStreakAndCheckMilestone(Student $student, string $today): ?array
    {
        $lastActive = $student->last_active_date ? Carbon::parse($student->last_active_date)->toDateString() : null;
        $yesterday = Carbon::now('Asia/Jakarta')->subDay()->toDateString();

        $streakIncreased = false;

        if ($lastActive === $yesterday) {
            $student->increment('streak');
            $student->refresh();
            $streakIncreased = true;
        } elseif ($lastActive !== $today) {
            $student->streak = 1;
            $student->save();
            $student->refresh();
            $streakIncreased = true;
        }

        $student->last_active_date = $today;
        $student->save();

        if (! $streakIncreased) {
            return null;
        }

        // Evaluasi Milestone Streak
        $milestone = null;
        if ($student->streak === 7) {
            $student->increment('xp', 50);
            $student->increment('coins', 20);
            $milestone = [
                'days' => 7,
                'bonus_xp' => 50,
                'bonus_coins' => 20,
                'title' => 'Pekan Bahari (7 Hari Berturut-turut)!',
            ];
        } elseif ($student->streak === 14) {
            $student->increment('xp', 100);
            $student->increment('coins', 50);
            $milestone = [
                'days' => 14,
                'bonus_xp' => 100,
                'bonus_coins' => 50,
                'title' => 'Pelaut Tangguh (14 Hari Berturut-turut)!',
            ];
        } elseif ($student->streak === 30) {
            $student->increment('xp', 250);
            $student->increment('coins', 150);
            $milestone = [
                'days' => 30,
                'bonus_xp' => 250,
                'bonus_coins' => 150,
                'title' => 'Nakhoda Samudra (30 Hari Berturut-turut)!',
            ];
        }

        return $milestone;
    }
}
