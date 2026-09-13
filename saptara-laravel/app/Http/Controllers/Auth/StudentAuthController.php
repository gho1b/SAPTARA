<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class StudentAuthController extends Controller
{
    /**
     * Student login:
     * Mode 1 (Primary): school_id + nis + access_code (PIN 6-digit)
     * Mode 2 (Legacy): name + classCode
     */
    public function login(Request $request)
    {
        // 1. Primary multi-tenant flow
        if ($request->filled('school_id') || $request->filled('nis')) {
            $request->validate([
                'school_id'   => 'required|integer|exists:schools,id',
                'nis'         => 'required|string',
                'access_code' => 'required|string',
            ], [
                'school_id.required'   => 'Harap pilih sekolah Anda',
                'school_id.exists'     => 'Sekolah tidak ditemukan',
                'nis.required'         => 'Harap masukkan NIS siswa',
                'access_code.required' => 'Harap masukkan kode unik / PIN siswa',
            ]);

            $student = Student::with(['class.school', 'school'])
                ->where('school_id', $request->school_id)
                ->where('nis', trim($request->nis))
                ->first();

            if (! $student) {
                return response()->json([
                    'error' => 'Siswa dengan NIS tersebut tidak ditemukan di sekolah ini.',
                ], 404);
            }

            if ($student->access_code !== trim($request->access_code)) {
                return response()->json([
                    'error' => 'Kode unik / PIN siswa salah. Hubungi gurumu jika lupa!',
                ], 401);
            }

            $cls = $student->class;

            return $this->respondWithToken($student, $cls);
        }

        // 2. Backward-compatible fallback: name + classCode
        $request->validate([
            'name'      => 'required|string',
            'classCode' => 'required|string',
        ]);

        $cls = SchoolClass::with('school')->where('class_code', strtoupper($request->classCode))->first();

        if (! $cls) {
            return response()->json(['error' => 'Kelas tidak ditemukan'], 404);
        }

        $student = Student::with('school')->where('class_id', $cls->id)
            ->whereRaw('LOWER(name) = LOWER(?)', [$request->name])
            ->first();

        if (! $student) {
            return response()->json(['error' => 'Nama tidak ditemukan di kelas ini. Hubungi gurumu!'], 404);
        }

        return $this->respondWithToken($student, $cls);
    }

    private function respondWithToken(Student $student, ?SchoolClass $cls)
    {
        $payload = [
            'studentId' => $student->id,
            'classId'   => $cls?->id,
            'schoolId'  => $student->school_id,
            'role'      => 'student',
        ];

        $token = JWTAuth::claims($payload)->fromUser($student);

        return response()->json([
            'token'   => $token,
            'student' => [
                'studentId' => $student->id,
                'classId'   => $cls?->id,
                'schoolId'  => $student->school_id,
                'nis'       => $student->nis,
                'name'      => $student->name,
                'avatar'    => $student->avatar,
            ],
            'class' => $cls ? [
                'id'         => $cls->id,
                'classCode'  => $cls->class_code,
                'schoolName' => $cls->school?->name ?: $cls->school_name,
                'shipName'   => $cls->ship_name,
            ] : null,
            'school' => $student->school ? [
                'id'   => $student->school->id,
                'name' => $student->school->name,
                'npsn' => $student->school->npsn,
                'logo' => $student->school->logo,
            ] : null,
        ]);
    }
}
