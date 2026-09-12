<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_missions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type')->default('total_habits'); // 'total_habits' | 'photo_logbooks'
            $table->integer('target_count')->default(100);
            $table->integer('reward_xp_each')->default(50);
            $table->integer('reward_coins_each')->default(20);
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['class_id', 'is_active']);
        });

        Schema::create('class_mission_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_mission_id')->constrained('class_missions')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->integer('reward_xp')->default(50);
            $table->integer('reward_coins')->default(20);
            $table->timestamps();

            $table->unique(['class_mission_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_mission_claims');
        Schema::dropIfExists('class_missions');
    }
};
