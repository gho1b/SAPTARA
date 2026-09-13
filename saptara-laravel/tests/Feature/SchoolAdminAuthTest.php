<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolAdminAuthTest extends TestCase
{
    use RefreshDatabase;

    private School $schoolA;
    private School $schoolB;
    private User $schoolAdminA;
    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->schoolA = School::create([
            'npsn'      => '12345678',
            'name'      => 'SMP Negeri 1 Merdeka',
            'city'      => 'Jakarta',
            'province'  => 'DKI Jakarta',
            'is_active' => true,
        ]);

        $this->schoolB = School::create([
            'npsn'      => '87654321',
            'name'      => 'SMP Negeri 2 Nusantara',
            'city'      => 'Surabaya',
            'province'  => 'Jawa Timur',
            'is_active' => true,
        ]);

        $this->schoolAdminA = User::create([
            'name'      => 'Admin SMPN 1 Merdeka',
            'email'     => 'admin@smpn1merdeka.sch.id',
            'password'  => bcrypt('adminpass123'),
            'role'      => 'school_admin',
            'school_id' => $this->schoolA->id,
        ]);

        $this->superAdmin = User::create([
            'name'     => 'Super Admin',
            'email'    => 'admin@saptara.id',
            'password' => bcrypt('password123'),
            'role'     => 'admin',
        ]);
    }

    public function test_school_admin_can_login_with_matching_school_and_email(): void
    {
        $response = $this->postJson('/api/school-admin/login', [
            'school_id' => $this->schoolA->id,
            'email'     => 'admin@smpn1merdeka.sch.id',
            'password'  => 'adminpass123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'token',
                'user'   => ['id', 'name', 'email', 'role', 'school_id'],
                'school' => ['id', 'npsn', 'name'],
            ])
            ->assertJsonPath('user.email', 'admin@smpn1merdeka.sch.id')
            ->assertJsonPath('user.role', 'school_admin')
            ->assertJsonPath('school.id', $this->schoolA->id);
    }

    public function test_school_admin_login_fails_if_school_mismatches(): void
    {
        // Admin of School A attempts login under School B
        $response = $this->postJson('/api/school-admin/login', [
            'school_id' => $this->schoolB->id,
            'email'     => 'admin@smpn1merdeka.sch.id',
            'password'  => 'adminpass123',
        ]);

        $response->assertStatus(401)
            ->assertJsonFragment(['error' => 'Email atau kata sandi salah, atau akun Anda tidak terdaftar sebagai Admin di sekolah ini.']);
    }

    public function test_non_school_admin_cannot_access_school_admin_endpoints(): void
    {
        $teacher = User::create([
            'name'      => 'Guru Budi',
            'email'     => 'budi@sekolah.id',
            'password'  => bcrypt('password123'),
            'role'      => 'teacher',
            'school_id' => $this->schoolA->id,
        ]);

        $response = $this->actingAs($teacher, 'sanctum')
            ->getJson('/api/school-admin/dashboard/stats');

        $response->assertStatus(403);
    }

    public function test_school_admin_login_fails_if_school_is_inactive(): void
    {
        $this->schoolA->update(['is_active' => false]);

        $response = $this->postJson('/api/school-admin/login', [
            'school_id' => $this->schoolA->id,
            'email'     => 'admin@smpn1merdeka.sch.id',
            'password'  => 'adminpass123',
        ]);

        $response->assertStatus(403);
    }

    public function test_super_admin_can_manage_school_admin_account(): void
    {
        // 1. Super admin checks admin account for School B (currently empty)
        $checkRes = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/admin/schools/{$this->schoolB->id}/admin-account");

        $checkRes->assertStatus(200)
            ->assertJson(['has_admin' => false]);

        // 2. Super admin creates school admin for School B
        $createRes = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/admin/schools/{$this->schoolB->id}/admin-account", [
                'name'     => 'Admin SMPN 2 Nusantara',
                'email'    => 'admin@smpn2nusantara.sch.id',
                'password' => 'secretpass123',
            ]);

        $createRes->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('users', [
            'email'     => 'admin@smpn2nusantara.sch.id',
            'role'      => 'school_admin',
            'school_id' => $this->schoolB->id,
        ]);

        // 3. New school admin can now login to School B!
        $loginRes = $this->postJson('/api/school-admin/login', [
            'school_id' => $this->schoolB->id,
            'email'     => 'admin@smpn2nusantara.sch.id',
            'password'  => 'secretpass123',
        ]);

        $loginRes->assertStatus(200)
            ->assertJsonPath('user.email', 'admin@smpn2nusantara.sch.id');
    }
}

