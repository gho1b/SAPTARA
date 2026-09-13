<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add role to users
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('teacher')->after('password');
            $table->index('role');
        });

        // 2. Add school_id to teachers
        Schema::table('teachers', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('user_id')->constrained('schools')->nullOnDelete();
            $table->index('school_id');
        });

        // 3. Add school_id to classes
        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('teacher_id')->constrained('schools')->cascadeOnDelete();
            $table->string('school_name')->nullable()->change();
            $table->index('school_id');
        });

        // 4. Add school_id, nis, access_code to students
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->string('nis', 50)->nullable()->after('class_id');
            $table->string('access_code', 20)->nullable()->after('nis');

            $table->unique(['school_id', 'nis']);
            $table->index('access_code');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique(['school_id', 'nis']);
            $table->dropColumn(['school_id', 'nis', 'access_code']);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropColumn('school_id');
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropColumn('school_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
