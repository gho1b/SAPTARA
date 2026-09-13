<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ParentProfile;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class ParentAuthController extends Controller
{
    /**
     * Parent quick login: child name + classCode → JWT token with role=parent.
     * (Backward-compatible)
     */
    public function login(Request $request)
    {
        $request->validate([
            'name'      => 'required|string',
            'classCode' => 'required|string',
        ]);

        $cls = SchoolClass::where('class_code', strtoupper($request->classCode))->first();

        if (! $cls) {
            return response()->json(['error' => 'Kelas tidak ditemukan'], 404);
        }

        $student = Student::where('class_id', $cls->id)
            ->whereRaw('LOWER(name) = LOWER(?)', [$request->name])
            ->first();

        if (! $student) {
            return response()->json(['error' => 'Nama anak tidak ditemukan di kelas ini. Hubungi gurunya!'], 404);
        }

        return $this->respondWithStudentToken($student, $cls);
    }

    /**
     * Parent email & password login (Phase 15: Multi-Anak).
     */
    public function loginWithEmail(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Email atau kata sandi salah'], 401);
        }

        $parent = ParentProfile::with(['students.class'])->where('user_id', $user->id)->first();

        if (! $parent) {
            // Auto create parent profile if user exists
            $parent = ParentProfile::create(['user_id' => $user->id]);
        }

        $students = $parent->students;
        $activeStudent = $students->first();

        if (! $activeStudent) {
            return response()->json([
                'token'     => null,
                'userId'    => $user->id,
                'parentId'  => $parent->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'children'  => [],
                'message'   => 'Belum ada anak yang dikaitkan. Silakan tautkan anak Anda.',
            ]);
        }

        $cls = $activeStudent->class;
        $response = $this->respondWithStudentToken($activeStudent, $cls);
        $data = $response->getData(true);
        $data['children'] = $this->formatChildrenList($students);
        $data['parentEmail'] = $user->email;
        $data['parentId'] = $parent->id;

        return response()->json($data);
    }

    /**
     * Register akun orang tua mandiri (Phase 15).
     */
    public function register(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|unique:users,email',
            'password'              => 'required|string|min:6|confirmed',
            'password_confirmation' => 'required|string|min:6',
            'phone'                 => 'nullable|string',
            'childName'             => 'nullable|string',
            'classCode'             => 'nullable|string',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $parent = ParentProfile::create([
            'user_id' => $user->id,
            'phone'   => $request->phone,
        ]);

        // Link first child if provided
        $linkedStudent = null;
        if ($request->filled('childName') && $request->filled('classCode')) {
            $cls = SchoolClass::where('class_code', strtoupper($request->classCode))->first();
            if ($cls) {
                $student = Student::where('class_id', $cls->id)
                    ->whereRaw('LOWER(name) = LOWER(?)', [$request->childName])
                    ->first();
                if ($student) {
                    $parent->students()->syncWithoutDetaching([$student->id]);
                    $linkedStudent = $student;
                    // Update student parent_email if empty
                    if (empty($student->parent_email)) {
                        $student->update(['parent_email' => $request->email]);
                    }
                }
            }
        }

        if ($linkedStudent) {
            $response = $this->respondWithStudentToken($linkedStudent, $linkedStudent->class);
            $data = $response->getData(true);
            $data['children'] = $this->formatChildrenList($parent->students);
            $data['parentEmail'] = $user->email;
            $data['parentId'] = $parent->id;
            return response()->json($data, 201);
        }

        return response()->json([
            'success'   => true,
            'message'   => 'Akun orang tua berhasil dibuat',
            'userId'    => $user->id,
            'parentId'  => $parent->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'children'  => [],
        ], 201);
    }

    /**
     * Tautkan anak tambahan ke akun orang tua (Multi-anak).
     */
    public function linkChild(Request $request)
    {
        $request->validate([
            'parentId'  => 'required|integer|exists:parents,id',
            'childName' => 'required|string',
            'classCode' => 'required|string',
        ]);

        $parent = ParentProfile::findOrFail($request->parentId);
        $cls = SchoolClass::where('class_code', strtoupper($request->classCode))->first();

        if (! $cls) {
            return response()->json(['error' => 'Kelas tidak ditemukan'], 404);
        }

        $student = Student::where('class_id', $cls->id)
            ->whereRaw('LOWER(name) = LOWER(?)', [$request->childName])
            ->first();

        if (! $student) {
            return response()->json(['error' => 'Nama anak tidak ditemukan di kelas ini'], 404);
        }

        $parent->students()->syncWithoutDetaching([$student->id]);

        return response()->json([
            'success'  => true,
            'message'  => "Berhasil menautkan {$student->name} ke akun orang tua",
            'student'  => $student,
            'children' => $this->formatChildrenList($parent->students()->with('class')->get()),
        ]);
    }

    /**
     * Ganti fokus anak yang sedang dipantau (switch active child).
     */
    public function switchChild(Request $request, int $studentId)
    {
        $student = Student::with('class')->findOrFail($studentId);
        return $this->respondWithStudentToken($student, $student->class);
    }

    /**
     * Helper to generate JWT token and standard parent response.
     */
    private function respondWithStudentToken(Student $student, ?SchoolClass $cls)
    {
        $payload = [
            'studentId'   => $student->id,
            'classId'     => $student->class_id,
            'studentName' => $student->name,
            'role'        => 'parent',
        ];

        $token = JWTAuth::claims($payload)->fromUser($student);

        return response()->json([
            'token'  => $token,
            'parent' => [
                'studentId'     => $student->id,
                'classId'       => $student->class_id,
                'studentName'   => $student->name,
                'studentAvatar' => $student->avatar,
            ],
            'class' => $cls ? [
                'id'         => $cls->id,
                'classCode'  => $cls->class_code,
                'schoolName' => $cls->school_name,
                'shipName'   => $cls->ship_name,
            ] : null,
        ]);
    }

    private function formatChildrenList($students)
    {
        return $students->map(fn($s) => [
            'id'         => $s->id,
            'name'       => $s->name,
            'avatar'     => $s->avatar,
            'xp'         => $s->xp,
            'classId'    => $s->class_id,
            'classCode'  => $s->class?->class_code,
            'schoolName' => $s->class?->school_name,
        ])->values();
    }
}
