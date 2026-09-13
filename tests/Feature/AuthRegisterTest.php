<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthRegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_register_successful_with_password_confirmation(): void
    {
        $response = $this->postJson('/api/auth/teacher/register', [
            'name'                  => 'Guru Budi',
            'email'                 => 'guru.budi@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'token',
                'user',
                'teacher' => ['id', 'user_id', 'display_name'],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'guru.budi@test.com',
            'name'  => 'Guru Budi',
        ]);

        $this->assertDatabaseHas('teachers', [
            'display_name' => 'Guru Budi',
        ]);
    }

    public function test_teacher_register_fails_if_password_confirmation_mismatch(): void
    {
        $response = $this->postJson('/api/auth/teacher/register', [
            'name'                  => 'Guru Budi',
            'email'                 => 'guru.budi@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'different_password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_parent_register_successful_with_password_confirmation(): void
    {
        $response = $this->postJson('/api/auth/parent/register', [
            'name'                  => 'Orang Tua Budi',
            'email'                 => 'ortu.budi@test.com',
            'password'              => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'userId',
                'parentId',
                'name',
                'email',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'ortu.budi@test.com',
        ]);
    }

    public function test_parent_register_fails_if_password_confirmation_mismatch(): void
    {
        $response = $this->postJson('/api/auth/parent/register', [
            'name'                  => 'Orang Tua Budi',
            'email'                 => 'ortu.budi@test.com',
            'password'              => 'secret123',
            'password_confirmation' => 'mismatch123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}

