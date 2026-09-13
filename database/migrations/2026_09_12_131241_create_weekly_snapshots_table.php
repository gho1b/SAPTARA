<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weekly_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->date('week_start_date');
            $table->tinyInteger('day_of_week'); // 0=Mon, 6=Sun
            $table->integer('completed_count')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['student_id', 'week_start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weekly_snapshots');
    }
};
