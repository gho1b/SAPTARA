<?php

namespace App\Http\Controllers;

use App\Models\Habit;
use App\Models\HabitCompletion;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HabitController extends Controller
{
    /** GET /api/habits — Semua habit (global + custom untuk kelas) */
    public function index(Request $request)
    {
        $classId = $request->query('class_id');

        $habits = $classId
            ? Habit::forClass((int) $classId)->get()
            : Habit::global()->get();

        return response()->json($habits);
    }

    /** GET /api/habits/missions/{studentId} — Misi hari ini */
    public function todayMissions(int $studentId)
    {
        $today    = Carbon::now('Asia/Jakarta')->toDateString();
        $habits   = Habit::all();
        $doneIds  = HabitCompletion::where('student_id', $studentId)
            ->where('date', $today)
            ->pluck('habit_id');

        $missions = $habits->map(fn($h) => [
            'habit'     => $h,
            'completed' => $doneIds->contains($h->id),
        ]);

        return response()->json($missions);
    }

    /** POST /api/habits/toggle — Toggle penyelesaian habit hari ini */
    public function toggle(Request $request)
    {
        $request->validate(['habit_id' => 'required|integer|exists:habits,id']);

        $studentId = $request->_student_id;
        $habitId   = $request->habit_id;
        $today     = Carbon::now('Asia/Jakarta')->toDateString();

        $existing = HabitCompletion::where('student_id', $studentId)
            ->where('habit_id', $habitId)
            ->where('date', $today)
            ->first();

        if ($existing) {
            // Uncomplete
            $existing->delete();
            Student::where('id', $studentId)->decrement('xp', 10);
            Student::where('id', $studentId)->decrement('coins', 5);
            return response()->json(['action' => 'uncompleted', 'habit_id' => $habitId]);
        }

        // Complete
        HabitCompletion::create([
            'student_id' => $studentId,
            'habit_id'   => $habitId,
            'date'       => $today,
        ]);

        $student = Student::find($studentId);
        $student->increment('xp', 10);
        $student->increment('coins', 5);
        $student->last_active_date = $today;
        $student->save();

        $this->updateStreak($student, $today);

        return response()->json(['action' => 'completed', 'habit_id' => $habitId]);
    }

    private function updateStreak(Student $student, string $today): void
    {
        $yesterday = Carbon::now('Asia/Jakarta')->subDay()->toDateString();
        $last      = $student->last_active_date?->toDateString();

        if ($last === $yesterday) {
            $student->increment('streak');
        } elseif ($last !== $today) {
            $student->update(['streak' => 1]);
        }
    }
}
