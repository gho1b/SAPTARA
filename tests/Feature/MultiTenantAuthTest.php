<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiTenantAuthTest extends TestCase
{
    use RefreshDatabase;

    private School $schoolA;
    private School $schoolB;
    private Teacher $teacherA;
    private SchoolClass $classA;
    private Student $studentA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->schoolA = School::create([
            'npsn'     => '10101010',
            'name'     => 'SMP Samudra A',
            'city'     => 'Jakarta',
            'province' => 'DKI Jakarta',
        ]);

        $this->schoolB = School::create([
            'npsn'     => '20202020',
            'name'     => 'SMP Bahari B',
            'city'     => 'Surabaya',
            'province' => 'Jawa Timur',
        ]);

        $user = User::create([
            'name'     => 'Guru Andi',
            'email'    => 'andi@samudra.sch.id',
            'password' => bcrypt('password123'),
            'role'     => 'teacher',
        ]);

        $this->teacherA = Teacher::create([
            'user_id'      => $user->id,
            'school_id'    => $this->schoolA->id,
            'display_name' => 'Pak Andi',
        ]);

        $this->classA = SchoolClass::create([
            'teacher_id'  => $this->teacherA->id,
            'school_id'   => $this->schoolA->id,
            'class_code'  => '7A',
            'ship_name'   => 'KRI Bahari',
            'school_name' => 'SMP Samudra A',
        ]);

        $this->studentA = Student::create([
            'school_id'   => $this->schoolA->id,
            'class_id'    => $this->classA->id,
            'name'        => 'Budi Samudra',
            'nis'         => '2024001',
            'access_code' => '654321',
        ]);
    }

    public function test_public_schools_endpoint_lists_and_searches(): void
    {
        $response = $this->getJson('/api/schools');
        $response->assertStatus(200)
            ->assertJsonCount(2);

        $searchResponse = $this->getJson('/api/schools?search=Surabaya');
        $searchResponse->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['name' => 'SMP Bahari B']);
    }

    public function test_student_login_with_nis_and_access_code_success(): void
    {
        $response = $this->postJson('/api/auth/student/login', [
            'school_id'   => $this->schoolA->id,
            'nis'         => '2024001',
            'access_code' => '654321',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'student' => ['studentId', 'schoolId', 'nis', 'name'],
                'class'   => ['id', 'classCode', 'schoolName'],
                'school'  => ['id', 'name', 'npsn'],
            ])
            ->assertJsonPath('student.name', 'Budi Samudra')
            ->assertJsonPath('school.npsn', '10101010');
    }

    public function test_student_login_fails_with_wrong_school(): void
    {
        $response = $this->postJson('/api/auth/student/login', [
            'school_id'   => $this->schoolB->id,
            'nis'         => '2024001',
            'access_code' => '654321',
        ]);

        $response->assertStatus(404)
            ->assertJson(['error' => 'Siswa dengan NIS tersebut tidak ditemukan di sekolah ini.']);
    }

    public function test_student_login_fails_with_wrong_access_code(): void
    {
        $response = $this->postJson('/api/auth/student/login', [
            'school_id'   => $this->schoolA->id,
            'nis'         => '2024001',
            'access_code' => '999999',
        ]);

        $response->assertStatus(401)
            ->assertJson(['error' => 'Kode unik / PIN siswa salah. Hubungi gurumu jika lupa!']);
    }

    public function test_parent_quick_access_with_nis_and_access_code(): void
    {
        $response = $this->postJson('/api/auth/parent/login', [
            'school_id'   => $this->schoolA->id,
            'nis'         => '2024001',
            'access_code' => '654321',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'parent' => ['studentId', 'studentName'],
                'class',
                'school',
            ])
            ->assertJsonPath('parent.studentName', 'Budi Samudra');
    }

    public function test_teacher_register_with_school_id(): void
    {
        $response = $this->postJson('/api/auth/teacher/register', [
            'school_id'             => $this->schoolB->id,
            'name'                  => 'Guru Baru',
            'email'                 => 'baru@bahari.sch.id',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['token', 'user', 'teacher']);

        $this->assertDatabaseHas('teachers', [
            'school_id' => $this->schoolB->id,
        ]);
    }

    public function test_teacher_can_reset_student_access_code(): void
    {
        $user = $this->teacherA->user;

        $response = $this->actingAs($user)
            ->patchJson("/api/students/{$this->studentA->id}/reset-code", [
                'access_code' => '888777',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success'     => true,
                'access_code' => '888777',
            ]);

        $this->studentA->refresh();
        $this->assertEquals('888777', $this->studentA->access_code);

        // Verify student can now login with new code
        $loginResponse = $this->postJson('/api/auth/student/login', [
            'school_id'   => $this->schoolA->id,
            'nis'         => '2024001',
            'access_code' => '888777',
        ]);

        $loginResponse->assertStatus(200);
    }
}

