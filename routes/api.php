<?php

use App\Http\Controllers\Auth\TeacherAuthController;
use App\Http\Controllers\Auth\StudentAuthController;
use App\Http\Controllers\Auth\ParentAuthController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\HabitController;
use App\Http\Controllers\LogbookController;
use App\Http\Controllers\RewardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\QuestController;
use App\Http\Controllers\ClassMissionController;
use App\Http\Controllers\SchoolPublicController;
use App\Http\Controllers\Admin\AdminSchoolController;
use App\Http\Controllers\Api\SchoolAdminAuthController;
use App\Http\Controllers\Api\SchoolAdminController;
use Illuminate\Support\Facades\Route;

// ── Health check ──────────────────────────────────────────────
Route::get('/health', fn() => response()->json([
    'status'    => 'ok',
    'name'      => 'SAPTARA API',
    'version'   => '2.0.0 (Laravel)',
    'timestamp' => now()->toISOString(),
]));

// ── Public Schools Directory ──────────────────────────────────
Route::get('/schools',      [SchoolPublicController::class, 'index']);
Route::get('/schools/{id}', [SchoolPublicController::class, 'show']);

// ── Auth ──────────────────────────────────────────────────────
Route::post('/auth/teacher/register',          [TeacherAuthController::class, 'register']);
Route::post('/auth/teacher/login',             [TeacherAuthController::class, 'login']);
Route::post('/auth/student/login',             [StudentAuthController::class, 'login']);
Route::post('/auth/parent/login',              [ParentAuthController::class, 'login']);
Route::post('/auth/parent/register',           [ParentAuthController::class, 'register']);
Route::post('/auth/parent/login-email',        [ParentAuthController::class, 'loginWithEmail']);
Route::post('/auth/parent/link-child',         [ParentAuthController::class, 'linkChild']);
Route::post('/auth/parent/switch-child/{id}',  [ParentAuthController::class, 'switchChild']);

// ── Teacher routes (Sanctum) ──────────────────────────────────
Route::middleware(['auth:sanctum', 'auth.teacher'])->group(function () {
    Route::get('/auth/me',      [TeacherAuthController::class, 'me']);
    Route::post('/auth/logout', [TeacherAuthController::class, 'logout']);

    // Classes
    Route::get('/classes',         [ClassController::class, 'index']);
    Route::post('/classes',        [ClassController::class, 'store']);
    Route::get('/classes/{id}',    [ClassController::class, 'show']);
    Route::delete('/classes/{id}', [ClassController::class, 'destroy']);

    // Students management (by teacher)
    Route::post('/students',                     [StudentController::class, 'store']);
    Route::put('/students/{id}',                 [StudentController::class, 'update']);
    Route::post('/students/import',              [StudentController::class, 'import']);
    Route::get('/students/template',             [StudentController::class, 'downloadTemplate']);
    Route::patch('/students/{id}/reset-code',    [StudentController::class, 'resetCode']);
    Route::delete('/students/{id}',              [StudentController::class, 'destroy']);

    // Reports (PDF & Excel)
    Route::get('/reports/student/{id}/pdf',   [ReportController::class, 'exportStudentPdf']);
    Route::get('/reports/class/{id}/pdf',     [ReportController::class, 'exportClassPdf']);
    Route::get('/reports/class/{id}/excel',   [ReportController::class, 'exportClassExcel']);

    // Logbook review
    Route::patch('/logbook/{id}/verify',  [LogbookController::class, 'verify']);
    Route::patch('/logbook/{id}/reject',  [LogbookController::class, 'reject']);
    Route::post('/logbook/batch-verify',  [LogbookController::class, 'batchVerify']);

    // Custom Habits (Phase 16)
    Route::post('/habits',                [HabitController::class, 'store']);
    Route::put('/habits/{id}',            [HabitController::class, 'update']);
    Route::delete('/habits/{id}',         [HabitController::class, 'destroy']);

    // Class Missions (Phase 19)
    Route::post('/classes/{id}/missions', [ClassMissionController::class, 'store']);

    // Rewards
    Route::post('/rewards/badges',   [RewardController::class, 'awardBadge']);
    Route::post('/rewards/message',  [RewardController::class, 'sendMessage']);
});

// ── Student routes (JWT) ──────────────────────────────────────
Route::middleware(['auth.student'])->group(function () {
    Route::post('/logbook',                              [LogbookController::class, 'store']);
    Route::post('/habits/toggle',                        [HabitController::class, 'toggle']);
    Route::post('/rewards/accessories/purchase',         [RewardController::class, 'purchase']);
    Route::post('/students/{id}/quests/{questKey}/claim', [QuestController::class, 'claim']);
    Route::post('/missions/{id}/claim',                  [ClassMissionController::class, 'claim']);
});

// ── Parent routes (JWT role=parent) ──────────────────────────
Route::middleware(['auth.parent'])->group(function () {
    Route::post('/logbook/{id}/parent-comment', [LogbookController::class, 'addParentComment']);
});

// ── Teacher OR Parent ─────────────────────────────────────────
Route::middleware(['auth.teacher.or.parent'])->group(function () {
    Route::get('/logbook/class/{classId}',   [LogbookController::class, 'byClass']);
    Route::get('/logbook/pending/{classId}', [LogbookController::class, 'pending']);
});

// ── Public routes ─────────────────────────────────────────────
Route::get('/classes/{id}/missions',                 [ClassMissionController::class, 'index']);
Route::get('/habits',                                [HabitController::class, 'index']);
Route::get('/habits/missions/{studentId}',           [HabitController::class, 'todayMissions']);
Route::get('/students/{id}/quests',                  [QuestController::class, 'index']);
Route::get('/logbook/student/{studentId}',           [LogbookController::class, 'byStudent']);
Route::get('/students/{classId}/list',               [StudentController::class, 'byClass']);
Route::get('/students/{classId}/leaderboard',        [StudentController::class, 'leaderboard']);
Route::get('/students/profile/{id}',                 [StudentController::class, 'show']);
Route::get('/students/{id}/dashboard',               [StudentController::class, 'dashboard']);
Route::get('/students/{id}/weekly',                  [StudentController::class, 'weekly']);
Route::get('/students/{id}/compass',                 [StudentController::class, 'compass']);
Route::get('/students/{id}/heatmap',                 [StudentController::class, 'heatmap']);
Route::get('/rewards/badges/{studentId}',            [RewardController::class, 'badges']);
Route::get('/rewards/accessories',                   [RewardController::class, 'accessories']);
Route::get('/rewards/accessories/{studentId}',       [RewardController::class, 'studentAccessories']);

// ── Super Admin Routes ─────────────────────────────────────────
Route::post('/admin/login', [AdminSchoolController::class, 'login']);

Route::middleware(['auth:sanctum', 'auth.admin'])->prefix('admin')->group(function () {
    Route::get('/me',                           [AdminSchoolController::class, 'me']);
    Route::get('/dashboard/stats',              [AdminSchoolController::class, 'dashboardStats']);
    Route::get('/schools',                      [AdminSchoolController::class, 'index']);
    Route::post('/schools',                     [AdminSchoolController::class, 'store']);
    Route::get('/schools/{id}',                 [AdminSchoolController::class, 'show']);
    Route::match(['put', 'post'], '/schools/{id}', [AdminSchoolController::class, 'update']);
    Route::patch('/schools/{id}/toggle-status', [AdminSchoolController::class, 'toggleStatus']);
    Route::delete('/schools/{id}',              [AdminSchoolController::class, 'destroy']);
    Route::get('/schools/{id}/admin-account',   [AdminSchoolController::class, 'getSchoolAdminAccount']);
    Route::post('/schools/{id}/admin-account',  [AdminSchoolController::class, 'saveSchoolAdminAccount']);
});

// ── School Admin Routes ─────────────────────────────────────────
Route::post('/school-admin/login', [SchoolAdminAuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'auth.school_admin'])->prefix('school-admin')->group(function () {
    Route::get('/me',                           [SchoolAdminAuthController::class, 'me']);
    Route::post('/logout',                      [SchoolAdminAuthController::class, 'logout']);
    Route::get('/dashboard/stats',              [SchoolAdminController::class, 'dashboardStats']);

    // Profil Sekolah
    Route::get('/profile',                      [SchoolAdminController::class, 'getProfile']);
    Route::match(['put', 'post'], '/profile',   [SchoolAdminController::class, 'updateProfile']);

    // Dewan Guru
    Route::get('/teachers',                     [SchoolAdminController::class, 'getTeachers']);
    Route::post('/teachers',                    [SchoolAdminController::class, 'createTeacher']);
    Route::put('/teachers/{id}/reset-password', [SchoolAdminController::class, 'resetTeacherPassword']);
    Route::delete('/teachers/{id}',             [SchoolAdminController::class, 'deleteTeacher']);

    // Rombel & Kelas
    Route::get('/classes',                      [SchoolAdminController::class, 'getClasses']);
    Route::post('/classes',                     [SchoolAdminController::class, 'createClass']);
    Route::put('/classes/{id}',                 [SchoolAdminController::class, 'updateClass']);
    Route::delete('/classes/{id}',              [SchoolAdminController::class, 'deleteClass']);

    // Data Siswa
    Route::get('/students',                     [SchoolAdminController::class, 'getStudents']);
    Route::post('/students',                    [SchoolAdminController::class, 'createStudent']);
    Route::put('/students/{id}',                [SchoolAdminController::class, 'updateStudent']);
    Route::patch('/students/{id}/reset-code',   [SchoolAdminController::class, 'resetStudentPin']);
    Route::delete('/students/{id}',             [SchoolAdminController::class, 'deleteStudent']);

    // Data Orang Tua
    Route::get('/parents',                      [SchoolAdminController::class, 'getParents']);
    Route::post('/parents/link',                [SchoolAdminController::class, 'linkParent']);
});

