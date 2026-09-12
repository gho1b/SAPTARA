<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('habits', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('icon');
            $table->string('island');
            $table->string('badge');
            $table->string('badge_icon');
            $table->string('color');
            $table->text('description');
            $table->integer('position_x');
            $table->integer('position_y');
            // Phase 16: custom habit support
            $table->boolean('is_custom')->default(false);
            $table->foreignId('created_by_teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('habits');
    }
};
