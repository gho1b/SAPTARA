<?php

namespace App\Http\Controllers;

use App\Models\Habit;
use App\Models\HabitCompletion;
use App\Models\LogbookEntry;
use App\Models\Student;
use App\Models\StudentDailyQuestClaim;
use Carbon\Carbon;
use Illuminate\Http\Request;

class QuestController extends Controller
{
    /**
     * GET /api/students/{id}/quests
     * Mengambil daftar misi harian beserta progress dan status klaim hari ini
     */
    public function index(int $id)
    {
        $student = Student::findOrFail($id);
        $today = Carbon::now('Asia/Jakarta')->toDateString();

        // 1. Hitung total habits untuk kelas siswa
        $classId = $student->class_id;
        $totalHabits = $classId ? Habit::forClass($classId)->count() : Habit::count();
        if ($totalHabits < 1) {
            $totalHabits = 7;
        }

        // 2. Hitung completion hari ini
        $todayCompletionsCount = HabitCompletion::where('student_id', $student->id)
            ->where('date', $today)
            ->count();

        // 3. Hitung logbook berfoto hari ini
        $todayPhotoLogbookCount = LogbookEntry::where('student_id', $student->id)
            ->where('date', $today)
            ->whereNotNull('photo_url')
            ->count();

        // 4. Ambil riwayat klaim hari ini
        $claimedKeys = StudentDailyQuestClaim::where('student_id', $student->id)
            ->where('date', $today)
            ->pluck('quest_key')
            ->toArray();

        $quests = [
            [
                'key' => 'quest_3_habits',
                'title' => 'Pelayaran Fajar',
                'description' => 'Selesaikan minimal 3 kebiasaan baik hari ini',
                'icon' => '🌅',
                'target' => 3,
                'progress' => min($todayCompletionsCount, 3),
                'completed' => $todayCompletionsCount >= 3,
                'claimed' => in_array('quest_3_habits', $claimedKeys),
                'rewardXp' => 15,
                'rewardCoins' => 5,
            ],
            [
                'key' => 'quest_photo_logbook',
                'title' => 'Lensa Bahari',
                'description' => 'Unggah minimal 1 jurnal foto logbook hari ini',
                'icon' => '📸',
                'target' => 1,
                'progress' => min($todayPhotoLogbookCount, 1),
                'completed' => $todayPhotoLogbookCount >= 1,
                'claimed' => in_array('quest_photo_logbook', $claimedKeys),
                'rewardXp' => 20,
                'rewardCoins' => 10,
            ],
            [
                'key' => 'quest_all_habits',
                'title' => 'Nakhoda Teladan',
                'description' => 'Tuntaskan seluruh misi kebiasaan hari ini',
                'icon' => '👑',
                'target' => $totalHabits,
                'progress' => min($todayCompletionsCount, $totalHabits),
                'completed' => $todayCompletionsCount >= $totalHabits,
                'claimed' => in_array('quest_all_habits', $claimedKeys),
                'rewardXp' => 50,
                'rewardCoins' => 25,
            ],
        ];

        return response()->json([
            'date' => $today,
            'quests' => $quests,
        ]);
    }

    /**
     * POST /api/students/{id}/quests/{questKey}/claim
     * Mengklaim reward misi harian jika syarat terpenuhi
     */
    public function claim(Request $request, int $id, string $questKey)
    {
        $student = Student::findOrFail($id);
        $today = Carbon::now('Asia/Jakarta')->toDateString();

        // Pastikan belum pernah diklaim hari ini
        $alreadyClaimed = StudentDailyQuestClaim::where('student_id', $student->id)
            ->where('quest_key', $questKey)
            ->where('date', $today)
            ->exists();

        if ($alreadyClaimed) {
            return response()->json(['error' => 'Hadiah misi ini sudah diklaim hari ini.'], 400);
        }

        // Validasi pemenuhan syarat misi
        $rewardXp = 0;
        $rewardCoins = 0;
        $isEligible = false;

        if ($questKey === 'quest_3_habits') {
            $done = HabitCompletion::where('student_id', $student->id)->where('date', $today)->count();
            if ($done >= 3) {
                $isEligible = true;
                $rewardXp = 15;
                $rewardCoins = 5;
            }
        } elseif ($questKey === 'quest_photo_logbook') {
            $hasPhoto = LogbookEntry::where('student_id', $student->id)
                ->where('date', $today)
                ->whereNotNull('photo_url')
                ->exists();
            if ($hasPhoto) {
                $isEligible = true;
                $rewardXp = 20;
                $rewardCoins = 10;
            }
        } elseif ($questKey === 'quest_all_habits') {
            $classId = $student->class_id;
            $totalHabits = $classId ? Habit::forClass($classId)->count() : Habit::count();
            $done = HabitCompletion::where('student_id', $student->id)->where('date', $today)->count();
            if ($done >= $totalHabits && $totalHabits > 0) {
                $isEligible = true;
                $rewardXp = 50;
                $rewardCoins = 25;
            }
        }

        if (! $isEligible) {
            return response()->json(['error' => 'Target misi belum tercapai.'], 400);
        }

        // Catat klaim
        StudentDailyQuestClaim::create([
            'student_id' => $student->id,
            'quest_key' => $questKey,
            'date' => $today,
            'reward_xp' => $rewardXp,
            'reward_coins' => $rewardCoins,
        ]);

        // Tambahkan reward ke student
        $student->increment('xp', $rewardXp);
        $student->increment('coins', $rewardCoins);
        $student->refresh();

        return response()->json([
            'message' => 'Hadiah misi berhasil diklaim!',
            'quest_key' => $questKey,
            'rewardXp' => $rewardXp,
            'rewardCoins' => $rewardCoins,
            'student' => [
                'xp' => $student->xp,
                'coins' => $student->coins,
                'level' => $student->level,
            ],
        ]);
    }
}
