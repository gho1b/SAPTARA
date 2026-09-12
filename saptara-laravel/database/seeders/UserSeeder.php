<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Teacher;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use PDO;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Locate saptara.db
        $possiblePaths = [
            base_path('../saptara.db'),
            base_path('saptara.db'),
            database_path('saptara.db'),
        ];

        $dbPath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $dbPath = $path;
                break;
            }
        }

        $sqliteUsers = [];
        $sqliteTeachers = [];
        $sqliteClasses = [];
        $sqliteStudents = [];

        if ($dbPath) {
            try {
                $pdo = new PDO('sqlite:' . $dbPath);
                $sqliteUsers = $pdo->query("SELECT * FROM user")->fetchAll(PDO::FETCH_ASSOC);
                $sqliteTeachers = $pdo->query("SELECT * FROM teacher")->fetchAll(PDO::FETCH_ASSOC);
                $sqliteClasses = $pdo->query("SELECT * FROM class")->fetchAll(PDO::FETCH_ASSOC);
                $sqliteStudents = $pdo->query("SELECT * FROM student")->fetchAll(PDO::FETCH_ASSOC);
                $this->command->info("Loaded data from SQLite database: {$dbPath}");
            } catch (\Exception $e) {
                $this->command->warn("Could not read from SQLite: " . $e->getMessage() . ". Using fallback data.");
            }
        }

        // Fallback data if saptara.db is missing or empty
        if (empty($sqliteUsers)) {
            $sqliteUsers = [
                ['id' => 'LxqixJPqGeTTv6WoOyzDg51XNHX1DRiZ', 'name' => 'Pak Firman', 'email' => 'firman@school.id'],
                ['id' => 'UAuZGb926hPtW44p4DBLCCmb3hd7uCNf', 'name' => 'Test Guru', 'email' => 'test@school.id'],
                ['id' => '43ckIE9PMmE2YwYsmLj7shp8uEHQa324', 'name' => 'Guru Baru Test', 'email' => 'gurubaru@school.id'],
                ['id' => 'G8bXiQlHRucMkIM1p7ZQo2zKpfPOtnZL', 'name' => 'devydevy', 'email' => 'devy@gmail.com'],
                ['id' => '6bz0Zlk2KrJdivyqsP0HQbkmEGHGqW3R', 'name' => 'fandi fandi', 'email' => 'fandi@gmail.com'],
                ['id' => 'wvImRzBHJOYSkB0s9dXyiUQJReaRwMVH', 'name' => 'devy f', 'email' => 'devyf@gmail.com'],
                ['id' => 'UtEtgqfQqwbM4eikaRZeTQG3XcQmVpuX', 'name' => 'FirmanYudhi', 'email' => 'firmanyudhi@gmail.com'],
            ];

            $sqliteTeachers = [
                ['id' => 1, 'user_id' => 'LxqixJPqGeTTv6WoOyzDg51XNHX1DRiZ', 'display_name' => 'Pak Firman'],
                ['id' => 2, 'user_id' => '43ckIE9PMmE2YwYsmLj7shp8uEHQa324', 'display_name' => 'Guru Baru Test'],
                ['id' => 3, 'user_id' => 'G8bXiQlHRucMkIM1p7ZQo2zKpfPOtnZL', 'display_name' => 'devydevy'],
                ['id' => 4, 'user_id' => '6bz0Zlk2KrJdivyqsP0HQbkmEGHGqW3R', 'display_name' => 'fandi fandi'],
                ['id' => 5, 'user_id' => 'wvImRzBHJOYSkB0s9dXyiUQJReaRwMVH', 'display_name' => 'devy f'],
                ['id' => 6, 'user_id' => 'UtEtgqfQqwbM4eikaRZeTQG3XcQmVpuX', 'display_name' => 'FirmanYudhi'],
            ];

            $sqliteClasses = [
                ['id' => 1, 'teacher_id' => 1, 'school_name' => 'SD Nusantara', 'class_code' => '5A', 'ship_name' => 'KRI Bahari'],
                ['id' => 2, 'teacher_id' => 3, 'school_name' => 'SD Kokap', 'class_code' => '5 KKP', 'ship_name' => 'Kapal Impian'],
                ['id' => 3, 'teacher_id' => 4, 'school_name' => 'SD Blumbang', 'class_code' => '3A', 'ship_name' => 'Kapal Laut'],
                ['id' => 4, 'teacher_id' => 5, 'school_name' => 'SD Kokap', 'class_code' => '5B', 'ship_name' => 'Kapal Kokap 5B'],
                ['id' => 5, 'teacher_id' => 6, 'school_name' => 'SDIT Budi Mulyo', 'class_code' => '7C', 'ship_name' => 'SDIT Budi Mulyo'],
            ];

            $sqliteStudents = [
                ['id' => 1, 'class_id' => 1, 'name' => 'Kaisara Aqilla', 'avatar' => '🧒', 'xp' => 25, 'coins' => 5, 'streak' => 0],
                ['id' => 2, 'class_id' => 1, 'name' => 'Dinda Lestari', 'avatar' => '🧒', 'xp' => 0, 'coins' => 0, 'streak' => 0],
                ['id' => 3, 'class_id' => 1, 'name' => 'Bronson', 'avatar' => '🧒', 'xp' => 0, 'coins' => 0, 'streak' => 0],
                ['id' => 4, 'class_id' => 2, 'name' => 'Agus', 'avatar' => '🧒', 'xp' => 10, 'coins' => 5, 'streak' => 0],
                ['id' => 5, 'class_id' => 3, 'name' => 'Aryo Pramono', 'avatar' => '👦🏽', 'xp' => 35, 'coins' => 5, 'streak' => 0],
                ['id' => 6, 'class_id' => 4, 'name' => 'Raju', 'avatar' => '🧒', 'xp' => 0, 'coins' => 0, 'streak' => 0],
                ['id' => 8, 'class_id' => 5, 'name' => 'Jeki', 'avatar' => '🧒', 'xp' => 25, 'coins' => 5, 'streak' => 0],
                ['id' => 9, 'class_id' => 5, 'name' => 'Budi', 'avatar' => '👦🏽', 'xp' => 0, 'coins' => 0, 'streak' => 0],
            ];
        }

        // Map sqlite teacher user_id to display_name
        $teacherMap = [];
        $teacherIdToUserId = [];
        foreach ($sqliteTeachers as $t) {
            $teacherMap[$t['user_id']] = $t['display_name'] ?? $t['name'] ?? 'Guru';
            if (isset($t['id'])) {
                $teacherIdToUserId[$t['id']] = $t['user_id'];
            }
        }

        $userIdToNewTeacherId = [];

        // 2. Seed Users & Teachers (Menggunakan hashing Bcrypt idiomatic Laravel)
        $defaultPassword = bcrypt('password123');
        $userCount = 0;

        foreach ($sqliteUsers as $u) {
            $user = User::updateOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'password' => $defaultPassword,
                    'email_verified_at' => now(),
                ]
            );

            $displayName = $teacherMap[$u['id']] ?? $u['name'];
            $teacher = Teacher::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'display_name' => $displayName,
                ]
            );

            $userIdToNewTeacherId[$u['id']] = $teacher->id;
            $userCount++;
        }

        $this->command->info("Seeded {$userCount} users and teachers (Password default: 'password123')");

        // 3. Seed Classes
        $classIdMap = [];
        $classCount = 0;

        foreach ($sqliteClasses as $c) {
            $oldTeacherId = $c['teacher_id'];
            $oldUserId = $teacherIdToUserId[$oldTeacherId] ?? null;
            $newTeacherId = $oldUserId ? ($userIdToNewTeacherId[$oldUserId] ?? null) : null;

            if (!$newTeacherId) {
                // Fallback to first teacher
                $newTeacherId = Teacher::first()->id;
            }

            $classCode = trim($c['class_code']);
            if (empty($classCode)) {
                $classCode = 'KLS-' . ($c['id'] ?? rand(100, 999));
            }

            $schoolClass = SchoolClass::updateOrCreate(
                [
                    'class_code' => $classCode,
                    'school_name' => $c['school_name'],
                ],
                [
                    'teacher_id' => $newTeacherId,
                    'ship_name' => $c['ship_name'] ?: 'KRI Saptara',
                    'semester' => 'Ganjil',
                    'tahun_ajaran' => '2026/2027',
                ]
            );

            if (isset($c['id'])) {
                $classIdMap[$c['id']] = $schoolClass->id;
            }
            $classCount++;
        }

        $this->command->info("Seeded {$classCount} classes linked to teachers.");

        // 4. Seed Students
        $studentCount = 0;
        foreach ($sqliteStudents as $s) {
            $oldClassId = $s['class_id'];
            $newClassId = $classIdMap[$oldClassId] ?? null;

            if (!$newClassId) {
                $newClassId = SchoolClass::first()->id;
            }

            Student::updateOrCreate(
                [
                    'name' => $s['name'],
                    'class_id' => $newClassId,
                ],
                [
                    'avatar' => $s['avatar'] ?? '🧒',
                    'xp' => $s['xp'] ?? 0,
                    'coins' => $s['coins'] ?? 0,
                    'streak' => $s['streak'] ?? 0,
                    'last_active_date' => $s['last_active_date'] ?? null,
                ]
            );
            $studentCount++;
        }

        $this->command->info("Seeded {$studentCount} students linked to classes.");
        $this->command->info("=== SEEDING SUMMARY ===");
        $this->command->info("Guru/User login credentials: [email di atas] / password: 'password123'");
        $this->command->info("Siswa login: [Nama Siswa] / [Kode Kelas], contoh: 'Kaisara Aqilla' / '5A'");
    }
}
