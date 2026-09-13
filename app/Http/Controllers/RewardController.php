<?php

namespace App\Http\Controllers;

use App\Mail\BadgeAwardedMail;
use App\Models\Habit;
use App\Models\LogbookEntry;
use App\Models\Student;
use App\Models\StudentAccessory;
use App\Models\StudentBadge;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class RewardController extends Controller
{
    // Static accessory catalogue (mirrors SHIP_ACCESSORIES in Node.js)
    private static array $ACCESSORIES = [
        ['id' => 'flag-merah',  'name' => 'Bendera Merah Putih',   'icon' => '🇮🇩', 'price' => 50,  'type' => 'flag'],
        ['id' => 'flag-bajak',  'name' => 'Bendera Bajak Laut',    'icon' => '🏴‍☠️', 'price' => 30,  'type' => 'flag'],
        ['id' => 'layar-biru',  'name' => 'Layar Biru Laut',       'icon' => '🔵', 'price' => 40,  'type' => 'sail'],
        ['id' => 'layar-emas',  'name' => 'Layar Emas',            'icon' => '🟡', 'price' => 80,  'type' => 'sail'],
        ['id' => 'meriam',      'name' => 'Meriam Konfeti',        'icon' => '🎆', 'price' => 100, 'type' => 'weapon'],
        ['id' => 'telescope',   'name' => 'Teropong Ajaib',        'icon' => '🔭', 'price' => 60,  'type' => 'tool'],
        ['id' => 'anchor-gold', 'name' => 'Jangkar Emas',          'icon' => '⚓', 'price' => 120, 'type' => 'anchor'],
        ['id' => 'parrot',      'name' => 'Burung Nuri Pendamping', 'icon' => '🦜', 'price' => 90,  'type' => 'pet'],
    ];

    /** GET /api/rewards/badges/{studentId} */
    public function badges(int $studentId)
    {
        $badges = StudentBadge::with('habit')
            ->where('student_id', $studentId)
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'habit_id' => $b->habit_id,
                'awarded_at' => $b->awarded_at,
                'habit_name' => $b->habit?->badge,
                'badge' => $b->habit?->badge,
                'badge_icon' => $b->habit?->badge_icon,
            ]);

        return response()->json($badges);
    }

    /** POST /api/rewards/badges — Guru beri badge */
    public function awardBadge(Request $request)
    {
        if (! $request->has('student_id') && $request->has('studentId')) {
            $request->merge(['student_id' => $request->studentId]);
        }
        if (! $request->has('habit_id') && $request->has('habitId')) {
            $request->merge(['habit_id' => $request->habitId]);
        }

        $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'habit_id' => 'required|integer|exists:habits,id',
        ]);

        $exists = StudentBadge::where('student_id', $request->student_id)
            ->where('habit_id', $request->habit_id)
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Murid sudah memiliki lencana ini'], 409);
        }

        $badge = StudentBadge::create([
            'student_id' => $request->student_id,
            'habit_id' => $request->habit_id,
            'awarded_by_teacher_id' => $request->_teacher->id,
        ]);

        $habit = Habit::find($request->habit_id);
        $habitName = $habit?->badge;

        // Notifikasi email otomatis ke orang tua jika parent_email tersedia
        try {
            $student = Student::with('class')->find($request->student_id);
            if ($student && $habit && ! empty($student->parent_email)) {
                Mail::to($student->parent_email)->send(
                    new BadgeAwardedMail($student, $habit)
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Gagal mengirim email piagam: '.$e->getMessage());
        }

        return response()->json(array_merge($badge->toArray(), ['badge_name' => $habitName]), 201);
    }

    /** GET /api/rewards/accessories */
    public function accessories()
    {
        return response()->json(self::$ACCESSORIES);
    }

    /** GET /api/rewards/accessories/{studentId} */
    public function studentAccessories(int $studentId)
    {
        $ownedIds = StudentAccessory::where('student_id', $studentId)->pluck('accessory_id');

        $list = array_map(
            fn ($acc) => array_merge($acc, ['owned' => $ownedIds->contains($acc['id'])]),
            self::$ACCESSORIES
        );

        return response()->json($list);
    }

    /** POST /api/rewards/accessories/purchase — Siswa beli aksesori */
    public function purchase(Request $request)
    {
        if (! $request->has('accessory_id') && $request->has('accessoryId')) {
            $request->merge(['accessory_id' => $request->accessoryId]);
        }

        $request->validate(['accessory_id' => 'required|string']);

        $acc = collect(self::$ACCESSORIES)->firstWhere('id', $request->accessory_id);
        if (! $acc) {
            return response()->json(['error' => 'Aksesori tidak ditemukan'], 404);
        }

        $studentId = $request->_student_id;

        $alreadyOwned = StudentAccessory::where('student_id', $studentId)
            ->where('accessory_id', $request->accessory_id)
            ->exists();

        if ($alreadyOwned) {
            return response()->json(['error' => 'Aksesori sudah dimiliki'], 409);
        }

        $student = Student::findOrFail($studentId);

        if ($student->coins < $acc['price']) {
            return response()->json(['error' => 'Koin tidak cukup!'], 400);
        }

        $student->decrement('coins', $acc['price']);

        $purchased = StudentAccessory::create([
            'student_id' => $studentId,
            'accessory_id' => $request->accessory_id,
        ]);

        return response()->json(array_merge($purchased->toArray(), ['accessory' => $acc]), 201);
    }

    /** POST /api/rewards/message — Guru kirim pesan botol ke siswa */
    public function sendMessage(Request $request)
    {
        if (! $request->has('student_id') && $request->has('studentId')) {
            $request->merge(['student_id' => $request->studentId]);
        }

        $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'comment' => 'required|string',
            'sticker' => 'nullable|string',
        ]);

        $now = Carbon::now('Asia/Jakarta');

        $entry = LogbookEntry::create([
            'student_id' => $request->student_id,
            'habit_id' => 1,
            'date' => $now->toDateString(),
            'time' => $now->toTimeString(),
            'caption' => 'Pesan dari Guru',
            'status' => 'verified',
            'reviewed_by_teacher_id' => $request->_teacher->id,
            'teacher_comment' => $request->comment,
            'teacher_sticker' => $request->sticker ?? '🪙',
            'xp_earned' => 10,
        ]);

        Student::where('id', $request->student_id)->increment('xp', 10);

        return response()->json($entry);
    }
}
