<?php

namespace App\Http\Controllers;

use App\Models\ClassMission;
use App\Models\ClassMissionClaim;
use App\Models\HabitCompletion;
use App\Models\LogbookEntry;
use App\Models\SchoolClass;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ClassMissionController extends Controller
{
    /**
     * GET /api/classes/{classId}/missions
     * Mengambil misi/tantangan kolektif kelas yang aktif beserta progres real-time seluruh awak
     */
    public function index(Request $request, int $classId)
    {
        $class = SchoolClass::findOrFail($classId);
        $studentId = $request->_student_id ?? $request->query('student_id');

        $now = Carbon::now('Asia/Jakarta');
        $today = $now->toDateString();

        // Cari misi aktif
        $missions = ClassMission::where('class_id', $classId)
            ->where('is_active', true)
            ->where('end_date', '>=', $today)
            ->orderBy('id', 'desc')
            ->get();

        // Jika belum ada misi aktif untuk kelas ini, buatkan otomatis 1 misi perdana
        if ($missions->isEmpty()) {
            $defaultMission = ClassMission::create([
                'class_id' => $classId,
                'title' => 'Ekspedisi Samudra Bersama',
                'description' => 'Seluruh awak kapal berlayar bersama mengumpulkan 100 kebiasaan baik dalam 7 hari!',
                'type' => 'total_habits',
                'target_count' => 100,
                'reward_xp_each' => 50,
                'reward_coins_each' => 25,
                'start_date' => $now->startOfWeek()->toDateString(),
                'end_date' => $now->endOfWeek()->toDateString(),
                'is_active' => true,
            ]);
            $missions = collect([$defaultMission]);
        }

        $studentIds = Student::where('class_id', $classId)->pluck('id');

        $enriched = $missions->map(function ($mission) use ($studentIds, $studentId, $today) {
            // Hitung progres real-time seluruh siswa di kelas dalam rentang waktu misi
            $progress = 0;
            if ($mission->type === 'photo_logbooks') {
                $progress = LogbookEntry::whereIn('student_id', $studentIds)
                    ->whereBetween('date', [$mission->start_date->toDateString(), $mission->end_date->toDateString()])
                    ->whereNotNull('photo_url')
                    ->count();
            } else {
                $progress = HabitCompletion::whereIn('student_id', $studentIds)
                    ->whereBetween('date', [$mission->start_date->toDateString(), $mission->end_date->toDateString()])
                    ->count();
            }

            $percentage = $mission->target_count > 0
                ? min(100, (int) round(($progress / $mission->target_count) * 100))
                : 0;

            $completed = $progress >= $mission->target_count;

            $claimed = false;
            if ($studentId) {
                $claimed = ClassMissionClaim::where('class_mission_id', $mission->id)
                    ->where('student_id', $studentId)
                    ->exists();
            }

            // Hitung sisa hari
            $daysLeft = max(0, Carbon::parse($mission->end_date)->diffInDays(Carbon::parse($today), false) * -1);

            return [
                'id' => $mission->id,
                'class_id' => $mission->class_id,
                'title' => $mission->title,
                'description' => $mission->description,
                'type' => $mission->type,
                'target_count' => $mission->target_count,
                'current_progress' => $progress,
                'percentage' => $percentage,
                'completed' => $completed,
                'claimed' => $claimed,
                'reward_xp_each' => $mission->reward_xp_each,
                'reward_coins_each' => $mission->reward_coins_each,
                'start_date' => $mission->start_date->toDateString(),
                'end_date' => $mission->end_date->toDateString(),
                'days_left' => $daysLeft,
            ];
        });

        return response()->json($enriched);
    }

    /**
     * POST /api/classes/{classId}/missions
     * Guru meluncurkan tantangan kolektif kelas baru
     */
    public function store(Request $request, int $classId)
    {
        $class = SchoolClass::findOrFail($classId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'type' => 'required|in:total_habits,photo_logbooks',
            'target_count' => 'required|integer|min:10|max:5000',
            'reward_xp_each' => 'nullable|integer|min:10|max:500',
            'reward_coins_each' => 'nullable|integer|min:5|max:200',
            'start_date' => 'nullable|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = $validated['start_date'] ?? Carbon::now('Asia/Jakarta')->toDateString();

        $mission = ClassMission::create([
            'class_id' => $class->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? 'Tantangan kolektif bersama seluruh siswa kelas',
            'type' => $validated['type'],
            'target_count' => $validated['target_count'],
            'reward_xp_each' => $validated['reward_xp_each'] ?? 50,
            'reward_coins_each' => $validated['reward_coins_each'] ?? 20,
            'start_date' => $startDate,
            'end_date' => $validated['end_date'],
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Tantangan kolektif kelas berhasil diluncurkan! ⛵',
            'mission' => $mission,
        ], 201);
    }

    /**
     * POST /api/missions/{id}/claim
     * Siswa mengklaim hadiah tantangan kelas saat target telah tercapai
     */
    public function claim(Request $request, int $id)
    {
        $studentId = $request->_student_id;
        if (! $studentId) {
            return response()->json(['error' => 'Login siswa diperlukan untuk klaim hadiah.'], 401);
        }

        $student = Student::findOrFail($studentId);
        $mission = ClassMission::findOrFail($id);

        if ($student->class_id !== $mission->class_id) {
            return response()->json(['error' => 'Siswa tidak terdaftar di kelas misi ini.'], 403);
        }

        // Cek apakah sudah pernah diklaim
        $alreadyClaimed = ClassMissionClaim::where('class_mission_id', $mission->id)
            ->where('student_id', $student->id)
            ->exists();

        if ($alreadyClaimed) {
            return response()->json(['error' => 'Anda sudah mengklaim hadiah dari ekspedisi kelas ini.'], 400);
        }

        // Hitung progres riil
        $studentIds = Student::where('class_id', $mission->class_id)->pluck('id');
        $progress = 0;
        if ($mission->type === 'photo_logbooks') {
            $progress = LogbookEntry::whereIn('student_id', $studentIds)
                ->whereBetween('date', [$mission->start_date->toDateString(), $mission->end_date->toDateString()])
                ->whereNotNull('photo_url')
                ->count();
        } else {
            $progress = HabitCompletion::whereIn('student_id', $studentIds)
                ->whereBetween('date', [$mission->start_date->toDateString(), $mission->end_date->toDateString()])
                ->count();
        }

        if ($progress < $mission->target_count) {
            return response()->json([
                'error' => "Target misi kelas belum tercapai ({$progress} dari {$mission->target_count}). Ayo ajak teman-temanmu berlayar bersama!",
            ], 400);
        }

        // Simpan klaim reward
        ClassMissionClaim::create([
            'class_mission_id' => $mission->id,
            'student_id' => $student->id,
            'reward_xp' => $mission->reward_xp_each,
            'reward_coins' => $mission->reward_coins_each,
        ]);

        // Tambahkan reward ke student
        $student->increment('xp', $mission->reward_xp_each);
        $student->increment('coins', $mission->reward_coins_each);
        $student->refresh();

        return response()->json([
            'message' => 'Selamat! Hadiah Ekspedisi Kelas berhasil kamu klaim! ⛵🎉',
            'rewardXp' => $mission->reward_xp_each,
            'rewardCoins' => $mission->reward_coins_each,
            'student' => [
                'xp' => $student->xp,
                'coins' => $student->coins,
                'level' => $student->level,
            ],
        ]);
    }
}
