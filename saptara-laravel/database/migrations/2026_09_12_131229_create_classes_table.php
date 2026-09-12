<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->string('school_name');
            $table->string('class_code');
            $table->string('ship_name');
            $table->string('semester')->nullable();
            $table->string('tahun_ajaran')->nullable();
            $table->timestamps();

            $table->unique(['class_code', 'school_name']);
            $table->index('teacher_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
