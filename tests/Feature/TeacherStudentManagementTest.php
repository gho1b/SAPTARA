<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherStudentManagementTest extends TestCase
{
    use RefreshDatabase;

    private School $schoolA;

    private School $schoolB;

    private User $teacherA;

    private SchoolClass $classA;

    private Student $studentA1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->schoolA = School::create([
            'npsn' => '10000001',
            'name' => 'SD Negeri 1 Merdeka',
            'address' => 'Jl. Merdeka No. 1',
            'village' => 'Gambir',
            'district' => 'Gambir',
            'city' => 'Jakarta Pusat',
            'province' => 'DKI Jakarta',
            'phone' => '021111111',
            'email' => 'sdn1merdeka@sekolah.id',
            'is_active' => true,
        ]);

        $this->schoolB = School::create([
            'npsn' => '20000002',
            'name' => 'SD Negeri 2 Nusantara',
            'address' => 'Jl. Nusantara No. 2',
            'village' => 'Menteng',
            'district' => 'Menteng',
            'city' => 'Jakarta Pusat',
            'province' => 'DKI Jakarta',
            'phone' => '021222222',
            'email' => 'sdn2nusantara@sekolah.id',
            'is_active' => true,
        ]);

        $this->teacherA = User::create([
            'name' => 'Guru Budi',
            'email' => 'budi@sdn1merdeka.sch.id',
            'password' => bcrypt('password123'),
            'role' => 'teacher',
            'school_id' => $this->schoolA->id,
        ]);

        $teacherRecordA = Teacher::create([
            'user_id' => $this->teacherA->id,
            'school_id' => $this->schoolA->id,
            'display_name' => 'Pak Budi',
        ]);

        $this->classA = SchoolClass::create([
            'teacher_id' => $teacherRecordA->id,
            'school_id' => $this->schoolA->id,
            'class_code' => '4A',
            'school_name' => $this->schoolA->name,
            'ship_name' => 'KRI Merdeka',
        ]);

        $this->studentA1 = Student::create([
            'name' => 'Ahmad Dahlan',
            'nis' => '10001',
            'access_code' => '123456',
            'avatar' => '🦊',
            'class_id' => $this->classA->id,
            'school_id' => $this->schoolA->id,
        ]);
    }

    public function test_teacher_can_update_student_profile_and_credentials(): void
    {
        $response = $this->actingAs($this->teacherA, 'sanctum')
            ->putJson("/api/students/{$this->studentA1->id}", [
                'name' => 'Ahmad Dahlan Al-Fatih',
                'nis' => '10002',
                'access_code' => '654321',
                'avatar' => '🦁',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'student' => [
                    'name' => 'Ahmad Dahlan Al-Fatih',
                    'nis' => '10002',
                    'access_code' => '654321',
                    'avatar' => '🦁',
                ],
            ]);

        $this->assertDatabaseHas('students', [
            'id' => $this->studentA1->id,
            'name' => 'Ahmad Dahlan Al-Fatih',
            'nis' => '10002',
            'access_code' => '654321',
            'avatar' => '🦁',
        ]);
    }

    public function test_teacher_cannot_set_duplicate_nis_within_same_school(): void
    {
        Student::create([
            'name' => 'Budi Santoso',
            'nis' => '10099',
            'access_code' => '111222',
            'avatar' => '🐼',
            'class_id' => $this->classA->id,
            'school_id' => $this->schoolA->id,
        ]);

        $response = $this->actingAs($this->teacherA, 'sanctum')
            ->putJson("/api/students/{$this->studentA1->id}", [
                'name' => 'Ahmad Dahlan',
                'nis' => '10099', // duplicate in School A
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'error' => 'NIS "10099" sudah digunakan oleh siswa lain di sekolah ini!',
            ]);
    }

    public function test_same_nis_is_allowed_in_different_school(): void
    {
        $teacherB = User::create([
            'name' => 'Guru Siti',
            'email' => 'siti@sdn2nusantara.sch.id',
            'password' => bcrypt('password123'),
            'role' => 'teacher',
            'school_id' => $this->schoolB->id,
        ]);

        $teacherRecordB = Teacher::create([
            'user_id' => $teacherB->id,
            'school_id' => $this->schoolB->id,
            'display_name' => 'Bu Siti',
        ]);

        $classB = SchoolClass::create([
            'teacher_id' => $teacherRecordB->id,
            'school_id' => $this->schoolB->id,
            'class_code' => '4B',
            'school_name' => $this->schoolB->name,
            'ship_name' => 'KRI Nusantara',
        ]);

        $studentB = Student::create([
            'name' => 'Citra Dewi',
            'nis' => '99999',
            'access_code' => '333444',
            'avatar' => '🐨',
            'class_id' => $classB->id,
            'school_id' => $this->schoolB->id,
        ]);

        // Updating student in School B to 10001 (which exists in School A) should succeed!
        $response = $this->actingAs($teacherB, 'sanctum')
            ->putJson("/api/students/{$studentB->id}", [
                'name' => 'Citra Dewi Updated',
                'nis' => '10001', // same as studentA1 in School A
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('students', [
            'id' => $studentB->id,
            'school_id' => $this->schoolB->id,
            'nis' => '10001',
        ]);
    }

    public function test_teacher_can_reset_student_access_code(): void
    {
        $response = $this->actingAs($this->teacherA, 'sanctum')
            ->patchJson("/api/students/{$this->studentA1->id}/reset-code");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->studentA1->refresh();
        $this->assertNotEmpty($this->studentA1->access_code);
        $this->assertNotEquals('123456', $this->studentA1->access_code);
    }

    public function test_student_can_login_with_updated_nis_and_pin(): void
    {
        // Update credentials
        $this->actingAs($this->teacherA, 'sanctum')
            ->putJson("/api/students/{$this->studentA1->id}", [
                'name' => 'Ahmad Dahlan',
                'nis' => '88888',
                'access_code' => '999999',
            ]);

        // Attempt login with new credentials
        $loginResponse = $this->postJson('/api/auth/student/login', [
            'school_id' => $this->schoolA->id,
            'nis' => '88888',
            'access_code' => '999999',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonPath('student.name', 'Ahmad Dahlan')
            ->assertJsonPath('student.nis', '88888');
    }
}
