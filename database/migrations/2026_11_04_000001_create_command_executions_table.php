<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('command_executions')) {
            Schema::create('command_executions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('command_key', 64)->index();
                $table->string('command', 128);
                $table->string('title', 128);
                $table->string('status', 32)->default('queued')->index(); // queued, running, completed, failed
                $table->integer('exit_code')->nullable();
                $table->string('output_log_path')->nullable();
                $table->json('options')->nullable();
                $table->unsignedBigInteger('executed_by_id')->nullable();
                $table->string('executed_by_name')->nullable();
                $table->string('executed_by_email')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('finished_at')->nullable();
                $table->integer('duration_seconds')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('command_executions');
    }
};
