<?php

namespace Tests\Feature;

use App\Models\Habit;
use App\Models\LogbookEntry;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\HabitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MigrateLogbookToR2Test extends TestCase
{
    use RefreshDatabase;

    private Student $student;

    private Habit $habit;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Storage::fake('r2');

        $this->seed(HabitSeeder::class);
        $this->habit = Habit::first();

        $school = School::create([
            'npsn' => '12345678',
            'name' => 'SD Negeri Bahari',
            'city' => 'Jakarta',
            'is_active' => true,
        ]);

        $teacherUser = User::create([
            'name' => 'Guru Bahari',
            'email' => 'guru@bahari.sch.id',
            'password' => bcrypt('password123'),
            'role' => 'teacher',
            'school_id' => $school->id,
        ]);

        $teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'school_id' => $school->id,
            'nip' => '1987654321',
            'display_name' => 'Guru Bahari',
        ]);

        $class = SchoolClass::create([
            'school_id' => $school->id,
            'teacher_id' => $teacher->id,
            'class_code' => 'KELAS-7A',
            'ship_name' => 'KRI Dewaruci',
            'level' => 7,
            'pin' => '1234',
        ]);

        $this->student = Student::create([
            'class_id' => $class->id,
            'school_id' => $school->id,
            'name' => 'Bintang Bahari',
            'nisn' => '0098765432',
            'avatar' => '👦',
            'xp' => 100,
            'coins' => 20,
        ]);
    }

    public function test_dry_run_does_not_upload_or_delete_local_files(): void
    {
        Storage::disk('public')->put('logbook/test_photo.jpg', 'dummy image content');

        $entry = LogbookEntry::create([
            'student_id' => $this->student->id,
            'habit_id' => $this->habit->id,
            'date' => '2026-11-03',
            'time' => '12:00:00',
            'photo_url' => '/storage/logbook/test_photo.jpg',
            'caption' => 'Test dry run',
            'status' => 'approved',
        ]);

        $this->artisan('logbook:migrate-to-r2', ['--dry-run' => true])
            ->assertSuccessful();

        // Local file harus tetap ada
        Storage::disk('public')->assertExists('logbook/test_photo.jpg');

        // File R2 belum boleh ada
        Storage::disk('r2')->assertMissing('logbook/test_photo.jpg');

        // URL database tidak berubah
        $this->assertEquals('/storage/logbook/test_photo.jpg', $entry->fresh()->photo_url);
    }

    public function test_migrates_1_by_1_and_immediately_deletes_local_file(): void
    {
        Storage::disk('public')->put('logbook/test_photo_live.jpg', 'live image content 12345');

        $entry = LogbookEntry::create([
            'student_id' => $this->student->id,
            'habit_id' => $this->habit->id,
            'date' => '2026-11-03',
            'time' => '12:00:00',
            'photo_url' => '/storage/logbook/test_photo_live.jpg',
            'caption' => 'Test live migration',
            'status' => 'approved',
        ]);

        $this->artisan('logbook:migrate-to-r2')
            ->assertSuccessful();

        // File harus sudah terupload di R2
        Storage::disk('r2')->assertExists('logbook/test_photo_live.jpg');
        $this->assertEquals('live image content 12345', Storage::disk('r2')->get('logbook/test_photo_live.jpg'));

        // File lokal HARUS LANGSUNG TERHAPUS untuk menghemat storage hosting
        Storage::disk('public')->assertMissing('logbook/test_photo_live.jpg');

        // URL di database harus terupdate ke R2 URL
        $freshUrl = $entry->fresh()->photo_url;
        $this->assertStringContainsString('static.saptara.id/logbook/test_photo_live.jpg', $freshUrl);
    }
}
