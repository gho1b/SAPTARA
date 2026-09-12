<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('logbook_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('habit_id')->constrained('habits')->cascadeOnDelete();
            $table->date('date');
            $table->time('time');
            $table->string('photo_url')->nullable();
            $table->text('caption');
            $table->enum('status', ['pending', 'verified', 'needs_revision'])->default('pending');
            $table->foreignId('reviewed_by_teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->text('teacher_comment')->nullable();
            $table->string('teacher_sticker')->nullable();
            $table->text('parent_comment')->nullable();
            $table->integer('xp_earned')->default(0);
            $table->timestamps();

            $table->index('student_id');
            $table->index('status');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logbook_entries');
    }
};
