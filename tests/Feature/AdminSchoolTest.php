<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSchoolTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $teacherUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'email' => 'admin@saptara.id',
            'password' => bcrypt('admin12345'),
            'role' => 'admin',
        ]);

        $this->teacherUser = User::factory()->create([
            'email' => 'guru@saptara.id',
            'password' => bcrypt('password123'),
            'role' => 'teacher',
        ]);
    }

    public function test_admin_login_success()
    {
        $response = $this->postJson('/api/admin/login', [
            'email' => 'admin@saptara.id',
            'password' => 'admin12345',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_teacher_cannot_login_via_admin_endpoint()
    {
        $response = $this->postJson('/api/admin/login', [
            'email' => 'guru@saptara.id',
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
    }

    public function test_teacher_cannot_access_admin_routes()
    {
        $token = $this->teacherUser->createToken('teacher-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/dashboard/stats');

        $response->assertStatus(403);
    }

    public function test_admin_can_view_dashboard_stats()
    {
        $school = School::create([
            'npsn' => '11112222',
            'name' => 'SMP Negeri 1 Testing',
            'slug' => 'smp-negeri-1-testing',
            'city' => 'Jakarta Pusat',
            'is_active' => true,
        ]);

        $token = $this->admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_schools',
                'active_schools',
                'inactive_schools',
                'total_teachers',
                'total_students',
                'total_classes',
                'total_habit_logs',
                'recent_schools',
            ])
            ->assertJson([
                'total_schools' => 1,
                'active_schools' => 1,
            ]);
    }

    public function test_admin_can_create_new_school()
    {
        $token = $this->admin->createToken('admin-token')->plainTextToken;

        $payload = [
            'npsn' => '87654321',
            'name' => 'SMP Bintang Gemilang',
            'address' => 'Jl. Bahari No. 10',
            'village' => 'Ancol',
            'district' => 'Pademangan',
            'city' => 'Jakarta Utara',
            'province' => 'DKI Jakarta',
            'phone' => '021-12345678',
            'email' => 'info@bintang-gemilang.sch.id',
            'website' => 'https://bintang-gemilang.sch.id',
            'is_active' => true,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/schools', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('school.npsn', '87654321')
            ->assertJsonPath('school.name', 'SMP Bintang Gemilang');

        $this->assertDatabaseHas('schools', [
            'npsn' => '87654321',
            'name' => 'SMP Bintang Gemilang',
        ]);
    }

    public function test_admin_can_update_school()
    {
        $school = School::create([
            'npsn' => '12345678',
            'name' => 'SMP Awal',
            'slug' => 'smp-awal',
            'city' => 'Surabaya',
            'is_active' => true,
        ]);

        $token = $this->admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/admin/schools/{$school->id}", [
                'npsn' => '12345678',
                'name' => 'SMP Baru Diubah',
                'city' => 'Malang',
                'province' => 'Jawa Timur',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('school.name', 'SMP Baru Diubah');

        $this->assertDatabaseHas('schools', [
            'id' => $school->id,
            'name' => 'SMP Baru Diubah',
            'city' => 'Malang',
        ]);
    }

    public function test_admin_can_toggle_school_active_status()
    {
        $school = School::create([
            'npsn' => '99887766',
            'name' => 'SMP Nonaktifkan Saya',
            'slug' => 'smp-nonaktifkan-saya',
            'is_active' => true,
        ]);

        $token = $this->admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/admin/schools/{$school->id}/toggle-status");

        $response->assertStatus(200)
            ->assertJsonPath('is_active', false);

        $this->assertDatabaseHas('schools', [
            'id' => $school->id,
            'is_active' => false,
        ]);
    }

    public function test_admin_cannot_delete_school_with_students()
    {
        $school = School::create([
            'npsn' => '55443322',
            'name' => 'SMP Ada Siswa',
            'slug' => 'smp-ada-siswa',
            'is_active' => true,
        ]);

        $teacher = Teacher::create([
            'user_id' => $this->teacherUser->id,
            'school_id' => $school->id,
            'display_name' => 'Pak Guru',
        ]);

        $class = SchoolClass::create([
            'teacher_id' => $teacher->id,
            'school_id' => $school->id,
            'class_code' => 'KLS-9Z',
            'ship_name' => 'Kapal Krakatau',
        ]);

        Student::create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'name' => 'Budi Testing',
            'nis' => '99901',
        ]);

        $token = $this->admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/admin/schools/{$school->id}");

        $response->assertStatus(422)
            ->assertJsonStructure(['error']);

        $this->assertDatabaseHas('schools', ['id' => $school->id]);
    }
}
