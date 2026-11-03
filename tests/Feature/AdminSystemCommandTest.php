<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class AdminSystemCommandTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;

    private string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'name' => 'Super Administrator',
            'email' => 'superadmin@saptara.id',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $this->adminToken = $this->adminUser->createToken('admin-token')->plainTextToken;
    }

    public function test_guest_cannot_access_or_run_commands(): void
    {
        $this->getJson('/api/admin/commands')->assertUnauthorized();
        $this->postJson('/api/admin/commands/run', ['command' => 'sync_streaks'])->assertUnauthorized();
    }

    public function test_super_admin_can_list_allowed_commands(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->adminToken)
            ->getJson('/api/admin/commands');

        $response->assertOk();
        $response->assertJsonFragment(['key' => 'backup_db']);
        $response->assertJsonFragment(['key' => 'migrate_r2']);
        $response->assertJsonFragment(['key' => 'optimize_photos']);
        $response->assertJsonFragment(['key' => 'send_weekly_reports']);
        $response->assertJsonFragment(['key' => 'sync_streaks']);
    }

    public function test_super_admin_executing_command_triggers_log_warning_and_returns_output(): void
    {
        Log::shouldReceive('warning')
            ->once()
            ->withArgs(function ($message, $context) {
                return str_contains($message, 'MANUAL oleh Super Admin')
                    && ($context['signature'] ?? '') === 'saptara:sync-streaks'
                    && ($context['executed_by_email'] ?? '') === 'superadmin@saptara.id';
            });

        // Allow any other logs
        Log::shouldReceive('info')->zeroOrMoreTimes();
        Log::shouldReceive('error')->zeroOrMoreTimes();

        $response = $this->withHeader('Authorization', 'Bearer '.$this->adminToken)
            ->postJson('/api/admin/commands/run', [
                'command' => 'sync_streaks',
                'options' => ['recalculate' => false],
            ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'command' => 'saptara:sync-streaks',
            'exit_code' => 0,
        ]);
        $this->assertNotEmpty($response->json('output'));
    }

    public function test_disallowed_command_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->adminToken)
            ->postJson('/api/admin/commands/run', [
                'command' => 'migrate:fresh',
            ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['success' => false]);
    }
}
