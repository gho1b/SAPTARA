<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolMultiTenantTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_school_with_auto_slug(): void
    {
        $school = School::create([
            'npsn' => '12345678',
            'name' => 'SMP Negeri 2 Samudra',
            'city' => 'Kota Jakarta Pusat',
            'province' => 'DKI Jakarta',
        ]);

        $this->assertDatabaseHas('schools', [
            'npsn' => '12345678',
            'name' => 'SMP Negeri 2 Samudra',
            'slug' => 'smp-negeri-2-samudra-12345678',
        ]);
    }

    public function test_school_has_multi_tenant_relationships(): void
    {
        $school = School::create([
            'npsn' => '11223344',
            'name' => 'SD Bahari Utama',
        ]);

        $user = User::create([
            'name' => 'Guru Siti',
            'email' => 'siti@bahari.sch.id',
            'password' => bcrypt('password123'),
            'role' => 'teacher',
        ]);

        $teacher = Teacher::create([
            'user_id' => $user->id,
            'school_id' => $school->id,
            'display_name' => 'Bu Siti',
        ]);

        $class = SchoolClass::create([
            'teacher_id' => $teacher->id,
            'school_id' => $school->id,
            'class_code' => '7A',
            'school_name' => $school->name,
            'ship_name' => 'KRI Bahari',
        ]);

        $student = Student::create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'nis' => '1001',
            'access_code' => '123456',
            'name' => 'Ahmad Bahari',
        ]);

        $this->assertTrue($school->teachers->contains($teacher));
        $this->assertTrue($school->classes->contains($class));
        $this->assertTrue($school->students->contains($student));
        $this->assertEquals($school->id, $student->school->id);
    }

    public function test_student_nis_is_unique_per_school(): void
    {
        $schoolA = School::create(['npsn' => '11111111', 'name' => 'Sekolah A']);
        $schoolB = School::create(['npsn' => '22222222', 'name' => 'Sekolah B']);

        $user = User::create(['name' => 'G', 'email' => 'g@s.id', 'password' => 'x']);
        $teacher = Teacher::create(['user_id' => $user->id, 'display_name' => 'G']);
        $classA = SchoolClass::create(['teacher_id' => $teacher->id, 'school_id' => $schoolA->id, 'class_code' => 'A', 'ship_name' => 'Kapal A']);
        $classB = SchoolClass::create(['teacher_id' => $teacher->id, 'school_id' => $schoolB->id, 'class_code' => 'B', 'ship_name' => 'Kapal B']);

        // Same NIS in DIFFERENT schools should SUCCEED
        $studentA = Student::create([
            'school_id' => $schoolA->id,
            'class_id' => $classA->id,
            'nis' => '202401',
            'name' => 'Siswa A',
        ]);

        $studentB = Student::create([
            'school_id' => $schoolB->id,
            'class_id' => $classB->id,
            'nis' => '202401',
            'name' => 'Siswa B',
        ]);

        $this->assertNotNull($studentA->id);
        $this->assertNotNull($studentB->id);

        // Same NIS in SAME school should FAIL with QueryException
        $this->expectException(QueryException::class);
        Student::create([
            'school_id' => $schoolA->id,
            'class_id' => $classA->id,
            'nis' => '202401',
            'name' => 'Siswa Duplicate',
        ]);
    }

    public function test_school_search_scope(): void
    {
        School::create(['npsn' => '88880001', 'name' => 'SMP Negeri 99 Jakarta', 'city' => 'Kota Jakarta Barat']);
        School::create(['npsn' => '88880002', 'name' => 'SMP Swasta Merdeka', 'city' => 'Kota Surabaya']);

        $results = School::search('Jakarta')->get();
        $this->assertCount(1, $results);
        $this->assertEquals('SMP Negeri 99 Jakarta', $results->first()->name);

        $resultsNpsn = School::search('88880002')->get();
        $this->assertCount(1, $resultsNpsn);
        $this->assertEquals('SMP Swasta Merdeka', $resultsNpsn->first()->name);
    }
}
