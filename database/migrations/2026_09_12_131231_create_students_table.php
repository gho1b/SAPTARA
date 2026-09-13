<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('name');
            $table->string('avatar')->default('🧒');
            $table->integer('xp')->default(0);
            $table->integer('coins')->default(0);
            $table->integer('streak')->default(0);
            $table->date('last_active_date')->nullable();
            $table->string('parent_email')->nullable();
            $table->timestamps();

            $table->unique(['name', 'class_id']);
            $table->index('class_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
