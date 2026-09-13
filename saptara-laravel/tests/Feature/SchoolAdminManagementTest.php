<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SchoolAdminManagementTest extends TestCase
{
    use RefreshDatabase;

    private School $schoolA;
    private School $schoolB;
    private User $adminA;
    private User $adminB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->schoolA = School::create([
            'npsn'      => '11112222',
            'name'      => 'SMP Negeri 1 Merdeka',
            'city'      => 'Jakarta',
            'province'  => 'DKI Jakarta',
            'is_active' => true,
        ]);

        $this->schoolB = School::create([
            'npsn'      => '33334444',
            'name'      => 'SMP Negeri 2 Nusantara',
            'city'      => 'Surabaya',
            'province'  => 'Jawa Timur',
            'is_active' => true,
        ]);

        $this->adminA = User::create([
            'name'      => 'Admin Sekolah A',
            'email'     => 'admin@schoolA.sch.id',
            'password'  => bcrypt('password123'),
            'role'      => 'school_admin',
            'school_id' => $this->schoolA->id,
        ]);

        $this->adminB = User::create([
            'name'      => 'Admin Sekolah B',
            'email'     => 'admin@schoolB.sch.id',
            'password'  => bcrypt('password123'),
            'role'      => 'school_admin',
            'school_id' => $this->schoolB->id,
        ]);
    }

    public function test_school_admin_can_view_and_update_school_profile(): void
    {
        $response = $this->actingAs($this->adminA, 'sanctum')
            ->putJson('/api/school-admin/profile', [
                'name'    => 'SMP Negeri 1 Merdeka Jaya',
                'phone'   => '021-999888',
                'email'   => 'info@smpn1merdeka.sch.id',
                'address' => 'Jl. Pendidikan No. 10',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('school.name', 'SMP Negeri 1 Merdeka Jaya');

        $this->assertDatabaseHas('schools', [
            'id'    => $this->schoolA->id,
            'name'  => 'SMP Negeri 1 Merdeka Jaya',
            'phone' => '021-999888',
        ]);
    }

    public function test_school_admin_can_manage_teachers(): void
    {
        // 1. Create Teacher
        $createRes = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/school-admin/teachers', [
                'name'         => 'Guru Joko',
                'email'        => 'joko@schoolA.sch.id',
                'password'     => 'password123',
                'display_name' => 'Pak Joko',
            ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('teacher.display_name', 'Pak Joko');

        $teacherId = $createRes->json('teacher.id');

        // 2. Reset Teacher Password
        $resetRes = $this->actingAs($this->adminA, 'sanctum')
            ->putJson("/api/school-admin/teachers/{$teacherId}/reset-password", [
                'password' => 'newsecret456',
            ]);

        $resetRes->assertStatus(200)
            ->assertJson(['success' => true]);

        $user = User::where('email', 'joko@schoolA.sch.id')->first();
        $this->assertTrue(Hash::check('newsecret456', $user->password));

        // 3. Delete Teacher
        $delRes = $this->actingAs($this->adminA, 'sanctum')
            ->deleteJson("/api/school-admin/teachers/{$teacherId}");

        $delRes->assertStatus(200);
        $this->assertDatabaseMissing('teachers', ['id' => $teacherId]);
    }

    public function test_school_admin_can_manage_classes_and_students(): void
    {
        // 1. Create Teacher for assignment
        $teacherUser = User::create([
            'name'      => 'Guru Siti',
            'email'     => 'siti@schoolA.sch.id',
            'password'  => bcrypt('password123'),
            'role'      => 'teacher',
            'school_id' => $this->schoolA->id,
        ]);
        $teacher = Teacher::create([
            'user_id'      => $teacherUser->id,
            'school_id'    => $this->schoolA->id,
            'display_name' => 'Bu Siti',
        ]);

        // 2. Create Class
        $classRes = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/school-admin/classes', [
                'class_code' => '7A',
                'ship_name'  => 'KRI Merdeka Bahari',
                'teacher_id' => $teacher->id,
            ]);

        $classRes->assertStatus(201)
            ->assertJsonPath('class.class_code', '7A');

        $classId = $classRes->json('class.id');

        // 3. Create Student
        $studentRes = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/school-admin/students', [
                'class_id'     => $classId,
                'name'         => 'Rian Pratama',
                'nis'          => '10001',
                'access_code'  => '123456',
                'parent_email' => 'wali.rian@gmail.com',
            ]);

        $studentRes->assertStatus(201)
            ->assertJsonPath('student.name', 'Rian Pratama')
            ->assertJsonPath('student.nis', '10001');

        $studentId = $studentRes->json('student.id');

        // 4. Reset Student PIN
        $pinRes = $this->actingAs($this->adminA, 'sanctum')
            ->patchJson("/api/school-admin/students/{$studentId}/reset-code");

        $pinRes->assertStatus(200)
            ->assertJson(['success' => true]);

        $newPin = $pinRes->json('access_code');
        $this->assertNotEmpty($newPin);
        $this->assertNotEquals('123456', $newPin);

        // 5. Link Parent
        $linkRes = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/school-admin/parents/link', [
                'student_id'   => $studentId,
                'parent_email' => 'new.parent@gmail.com',
            ]);

        $linkRes->assertStatus(200)
            ->assertJsonPath('student.parent_email', 'new.parent@gmail.com');
    }

    public function test_tenant_isolation_prevents_cross_school_tampering(): void
    {
        // Class created in School B
        $teacherB = User::create([
            'name'      => 'Guru B',
            'email'     => 'guru@schoolB.sch.id',
            'password'  => bcrypt('pass'),
            'role'      => 'teacher',
            'school_id' => $this->schoolB->id,
        ]);
        $teacherRecordB = Teacher::create([
            'user_id'      => $teacherB->id,
            'school_id'    => $this->schoolB->id,
            'display_name' => 'Pak B',
        ]);
        $classB = SchoolClass::create([
            'teacher_id'  => $teacherRecordB->id,
            'school_id'   => $this->schoolB->id,
            'class_code'  => '8B',
            'ship_name'   => 'KRI Nusantara',
            'school_name' => 'SMP Negeri 2 Nusantara',
        ]);
        $studentB = Student::create([
            'name'        => 'Siswa B',
            'nis'         => '99999',
            'class_id'    => $classB->id,
            'school_id'   => $this->schoolB->id,
        ]);

        // Admin A tries to delete or update student in School B
        $tamperRes = $this->actingAs($this->adminA, 'sanctum')
            ->deleteJson("/api/school-admin/students/{$studentB->id}");

        $tamperRes->assertStatus(404); // Scoped to schoolA, thus not found!

        $this->assertDatabaseHas('students', [
            'id' => $studentB->id,
        ]);
    }
}
