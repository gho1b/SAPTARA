<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel profil orang tua (Phase 15)
        Schema::create('parents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('phone')->nullable();
            $table->timestamps();
        });

        // Pivot relasi orang tua ke anak (multi-anak)
        Schema::create('parent_student', function (Blueprint $table) {
            $table->foreignId('parent_id')->constrained('parents')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['parent_id', 'student_id']);
        });

        // 2. Tabel klaim misi harian (Phase 17)
        Schema::create('student_daily_quest_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('quest_key', 50); // 'morning_sail', 'ocean_lens', 'perfect_habits'
            $table->date('date');
            $table->integer('reward_xp')->default(0);
            $table->integer('reward_coins')->default(0);
            $table->timestamps();

            $table->unique(['student_id', 'quest_key', 'date']);
            $table->index(['student_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_daily_quest_claims');
        Schema::dropIfExists('parent_student');
        Schema::dropIfExists('parents');
    }
};
