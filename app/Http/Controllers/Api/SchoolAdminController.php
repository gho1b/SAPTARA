<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SchoolAdminController extends Controller
{
    private function getSchoolId(Request $request): int
    {
        return (int) $request->user()->school_id;
    }

    /**
     * GET /api/school-admin/dashboard/stats
     */
    public function dashboardStats(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $school = School::withCount(['classes', 'teachers', 'students'])->findOrFail($schoolId);

        $linkedParentsCount = Student::where('school_id', $schoolId)
            ->whereNotNull('parent_email')
            ->where('parent_email', '!=', '')
            ->distinct('parent_email')
            ->count('parent_email');

        $recentStudents = Student::where('school_id', $schoolId)
            ->with('schoolClass')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $classes = SchoolClass::where('school_id', $schoolId)
            ->with('teacher.user')
            ->withCount('students')
            ->get();

        return response()->json([
            'school' => $school,
            'stats'  => [
                'total_teachers'        => $school->teachers_count,
                'total_classes'         => $school->classes_count,
                'total_students'        => $school->students_count,
                'linked_parents_count'  => $linkedParentsCount,
            ],
            'recent_students' => $recentStudents,
            'classes'         => $classes,
        ]);
    }

    /**
     * GET /api/school-admin/profile
     */
    public function getProfile(Request $request)
    {
        $school = School::findOrFail($this->getSchoolId($request));
        return response()->json($school);
    }

    /**
     * PUT /api/school-admin/profile
     */
    public function updateProfile(Request $request)
    {
        $school = School::findOrFail($this->getSchoolId($request));

        $request->validate([
            'name'     => 'required|string|max:255',
            'address'  => 'nullable|string',
            'village'  => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'city'     => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'phone'    => 'nullable|string|max:50',
            'email'    => 'nullable|email|max:100',
            'website'  => 'nullable|string|max:255',
            'logo'     => 'nullable',
        ]);

        $logoPath = $school->logo;
        if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            $path = $request->file('logo')->store('schools', 'public');
            $logoPath = Storage::url($path);
        } elseif ($request->filled('logo') && is_string($request->logo)) {
            $logoPath = $request->logo;
        }

        $school->update([
            'name'     => $request->name,
            'address'  => $request->address,
            'village'  => $request->village,
            'district' => $request->district,
            'city'     => $request->city,
            'province' => $request->province,
            'phone'    => $request->phone,
            'email'    => $request->email,
            'website'  => $request->website,
            'logo'     => $logoPath,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profil sekolah berhasil diperbarui.',
            'school'  => $school,
        ]);
    }

    /**
     * GET /api/school-admin/teachers
     */
    public function getTeachers(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $teachers = Teacher::where('school_id', $schoolId)
            ->with(['user', 'classes'])
            ->withCount('classes')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($teachers);
    }

    /**
     * POST /api/school-admin/teachers
     */
    public function createTeacher(Request $request)
    {
        $schoolId = $this->getSchoolId($request);

        $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:6',
            'display_name' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name'              => $request->name,
            'email'             => $request->email,
            'password'          => Hash::make($request->password),
            'role'              => 'teacher',
            'school_id'         => $schoolId,
            'email_verified_at' => now(),
        ]);

        $teacher = Teacher::create([
            'user_id'      => $user->id,
            'school_id'    => $schoolId,
            'display_name' => $request->display_name ?: $request->name,
        ]);

        $teacher->load('user');

        return response()->json([
            'success' => true,
            'message' => "Guru {$request->name} berhasil ditambahkan ke sekolah!",
            'teacher' => $teacher,
        ], 201);
    }

    /**
     * PUT /api/school-admin/teachers/{id}/reset-password
     */
    public function resetTeacherPassword(Request $request, int $id)
    {
        $schoolId = $this->getSchoolId($request);
        $teacher = Teacher::where('school_id', $schoolId)->where('id', $id)->firstOrFail();

        $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $teacher->user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Kata sandi untuk {$teacher->display_name} berhasil diatur ulang.",
        ]);
    }

    /**
     * DELETE /api/school-admin/teachers/{id}
     */
    public function deleteTeacher(Request $request, int $id)
    {
        $schoolId = $this->getSchoolId($request);
        $teacher = Teacher::where('school_id', $schoolId)->where('id', $id)->firstOrFail();

        // Check if teacher currently has classes
        $hasClasses = SchoolClass::where('teacher_id', $teacher->id)->exists();
        if ($hasClasses) {
            return response()->json([
                'error' => 'Guru tidak dapat dihapus karena masih mengampu kelas aktif. Pindahkan kelas terlebih dahulu.',
            ], 409);
        }

        $user = $teacher->user;
        $teacher->delete();
        if ($user) {
            $user->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Guru berhasil dihapus dari sistem sekolah.',
        ]);
    }

    /**
     * GET /api/school-admin/classes
     */
    public function getClasses(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $classes = SchoolClass::where('school_id', $schoolId)
            ->with('teacher.user')
            ->withCount('students')
            ->orderBy('class_code', 'asc')
            ->get();

        return response()->json($classes);
    }

    /**
     * POST /api/school-admin/classes
     */
    public function createClass(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $school = School::findOrFail($schoolId);

        $request->validate([
            'class_code'   => 'required|string|max:50',
            'ship_name'    => 'nullable|string|max:100',
            'teacher_id'   => 'required|integer|exists:teachers,id',
            'semester'     => 'nullable|string|max:20',
            'tahun_ajaran' => 'nullable|string|max:30',
        ]);

        // Verify teacher belongs to this school
        $teacher = Teacher::where('school_id', $schoolId)->where('id', $request->teacher_id)->first();
        if (!$teacher) {
            return response()->json(['error' => 'Guru yang dipilih bukan dewan guru dari sekolah ini.'], 422);
        }

        $class = SchoolClass::create([
            'teacher_id'   => $teacher->id,
            'school_id'    => $schoolId,
            'school_name'  => $school->name,
            'class_code'   => $request->class_code,
            'ship_name'    => $request->ship_name ?: "KRI {$request->class_code}",
            'semester'     => $request->semester ?: 'Ganjil',
            'tahun_ajaran' => $request->tahun_ajaran ?: '2026/2027',
        ]);

        $class->load('teacher.user');

        return response()->json([
            'success' => true,
            'message' => "Kelas {$class->class_code} berhasil dibuat!",
            'class'   => $class,
        ], 201);
    }

    /**
     * PUT /api/school-admin/classes/{id}
     */
    public function updateClass(Request $request, int $id)
    {
        $schoolId = $this->getSchoolId($request);
        $class = SchoolClass::where('school_id', $schoolId)->where('id', $id)->firstOrFail();

        $request->validate([
            'class_code'   => 'required|string|max:50',
            'ship_name'    => 'nullable|string|max:100',
            'teacher_id'   => 'required|integer|exists:teachers,id',
            'semester'     => 'nullable|string|max:20',
            'tahun_ajaran' => 'nullable|string|max:30',
        ]);

        // Verify teacher belongs to this school
        $teacher = Teacher::where('school_id', $schoolId)->where('id', $request->teacher_id)->first();
        if (!$teacher) {
            return response()->json(['error' => 'Guru yang dipilih bukan dewan guru dari sekolah ini.'], 422);
        }

        $class->update([
            'class_code'   => $request->class_code,
            'ship_name'    => $request->ship_name ?: $class->ship_name,
            'teacher_id'   => $teacher->id,
            'semester'     => $request->semester ?: $class->semester,
            'tahun_ajaran' => $request->tahun_ajaran ?: $class->tahun_ajaran,
        ]);

        $class->load('teacher.user');

        return response()->json([
            'success' => true,
            'message' => "Data kelas {$class->class_code} berhasil diperbarui!",
            'class'   => $class,
        ]);
    }

    /**
     * DELETE /api/school-admin/classes/{id}
     */
    public function deleteClass(Request $request, int $id)
    {
        $schoolId = $this->getSchoolId($request);
        $class = SchoolClass::where('school_id', $schoolId)->where('id', $id)->firstOrFail();

        if ($class->students()->count() > 0) {
            return response()->json([
                'error' => 'Kelas tidak dapat dihapus karena masih memiliki siswa terdaftar.',
            ], 409);
        }

        $class->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dihapus.',
        ]);
    }

    /**
     * GET /api/school-admin/students
     */
    public function getStudents(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $query = Student::where('school_id', $schoolId)->with('schoolClass');

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%");
            });
        }

        $perPage = max(1, min(100, (int) $request->input('per_page', 20)));
        $students = $query->orderBy('name', 'asc')->paginate($perPage);

        return response()->json($students);
    }

    /**
     * POST /api/school-admin/students
     */
    public function createStudent(Request $request)
    {
        $schoolId = $this->getSchoolId($request);

        $request->validate([
            'class_id'     => 'required|integer|exists:classes,id',
            'name'         => 'required|string|max:255',
            'nis'          => 'nullable|string|max:50',
            'access_code'  => 'nullable|string|max:20',
            'avatar'       => 'nullable|string',
            'parent_email' => 'nullable|email|max:100',
        ]);

        // Verify class belongs to this school
        $class = SchoolClass::where('school_id', $schoolId)->where('id', $request->class_id)->first();
        if (!$class) {
            return response()->json(['error' => 'Kelas yang dipilih tidak terdaftar di sekolah ini.'], 422);
        }

        // NIS determination & uniqueness
        $nis = $request->filled('nis') ? trim($request->nis) : (string) rand(100000, 999999);
        $existsNis = Student::where('school_id', $schoolId)->where('nis', $nis)->exists();
        if ($existsNis) {
            return response()->json(['error' => "NIS \"{$nis}\" sudah digunakan oleh siswa lain di sekolah ini."], 409);
        }

        // Access code (PIN)
        $accessCode = $request->filled('access_code') ? trim($request->access_code) : (string) rand(100000, 999999);

        $student = Student::create([
            'school_id'    => $schoolId,
            'class_id'     => $class->id,
            'name'         => $request->name,
            'nis'          => $nis,
            'access_code'  => $accessCode,
            'avatar'       => $request->avatar ?: '🦊',
            'parent_email' => $request->parent_email,
            'xp'           => 0,
            'coins'        => 0,
            'streak'       => 0,
        ]);

        $student->load('schoolClass');

        return response()->json([
            'success' => true,
            'message' => "Siswa {$student->name} berhasil ditambahkan!",
            'student' => $student,
        ], 201);
    }

    /**
     * PUT /api/school-admin/students/{id}
     */
    public function updateStudent(Request $request, int $id)
    {
        $schoolId = $this->getSchoolId($request);
        $student = Student::where('school_id', $schoolId)->where('id', $id)->firstOrFail();

        $request->validate([
            'name'         => 'sometimes|required|string|max:255',
            'class_id'     => 'sometimes|required|integer|exists:classes,id',
            'nis'          => 'nullable|string|max:50',
            'access_code'  => 'nullable|string|max:20',
            'avatar'       => 'nullable|string',
            'parent_email' => 'nullable|email|max:100',
        ]);

        if ($request->filled('class_id')) {
            $class = SchoolClass::where('school_id', $schoolId)->where('id', $request->class_id)->first();
            if (!$class) {
                return response()->json(['error' => 'Kelas tidak valid di sekolah ini.'], 422);
            }
            $student->class_id = $class->id;
        }

        if ($request->filled('nis')) {
            $newNis = trim($request->nis);
            $duplicate = Student::where('school_id', $schoolId)
                ->where('nis', $newNis)
                ->where('id', '!=', $student->id)
                ->exists();
            if ($duplicate) {
                return response()->json(['error' => "NIS \"{$newNis}\" sudah digunakan oleh siswa lain di sekolah ini."], 409);
            }
            $student->nis = $newNis;
        }

        if ($request->filled('name')) {
            $student->name = $request->name;
        }
        if ($request->filled('access_code')) {
            $student->access_code = $request->access_code;
        }
        if ($request->filled('avatar')) {
            $student->avatar = $request->avatar;
        }
        if ($request->has('parent_email')) {
            $student->parent_email = $request->parent_email;
        }

        $student->save();
        $student->load('schoolClass');

        return response()->json([
            'success' => true,
            'message' => "Data siswa {$student->name} berhasil diperbarui!",
            'student' => $student,
        ]);
    }

    /**
     * PATCH /api/school-admin/students/{id}/reset-code
     */
    public function resetStudentPin(Request $request, int $id)
    {
        $schoolId = $this->getSchoolId($request);
        $student = Student::where('school_id', $schoolId)->where('id', $id)->firstOrFail();

        $newCode = (string) rand(100000, 999999);
        $student->update(['access_code' => $newCode]);

        return response()->json([
            'success'     => true,
            'message'     => "PIN akses baru untuk {$student->name} berhasil dibuat!",
            'access_code' => $newCode,
        ]);
    }

    /**
     * DELETE /api/school-admin/students/{id}
     */
    public function deleteStudent(Request $request, int $id)
    {
        $schoolId = $this->getSchoolId($request);
        $student = Student::where('school_id', $schoolId)->where('id', $id)->firstOrFail();

        $student->delete();

        return response()->json([
            'success' => true,
            'message' => 'Siswa berhasil dihapus dari sistem sekolah.',
        ]);
    }

    /**
     * GET /api/school-admin/parents
     */
    public function getParents(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $studentsWithParents = Student::where('school_id', $schoolId)
            ->whereNotNull('parent_email')
            ->where('parent_email', '!=', '')
            ->with('schoolClass')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($studentsWithParents);
    }

    /**
     * POST /api/school-admin/parents/link
     */
    public function linkParent(Request $request)
    {
        $schoolId = $this->getSchoolId($request);

        $request->validate([
            'student_id'   => 'required|integer|exists:students,id',
            'parent_email' => 'required|email|max:100',
        ]);

        $student = Student::where('school_id', $schoolId)->where('id', $request->student_id)->firstOrFail();
        $student->update([
            'parent_email' => $request->parent_email,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Email wali murid {$request->parent_email} berhasil ditautkan ke siswa {$student->name}!",
            'student' => $student,
        ]);
    }
}

