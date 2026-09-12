<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class StudentAuthController extends Controller
{
    /**
     * Student login: name + classCode → JWT token.
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
            return response()->json(['error' => 'Nama tidak ditemukan di kelas ini. Hubungi gurumu!'], 404);
        }

        $payload = [
            'studentId' => $student->id,
            'classId'   => $cls->id,
            'role'      => 'student',
        ];

        $token = JWTAuth::claims($payload)->fromUser($student);

        return response()->json([
            'token'   => $token,
            'student' => [
                'studentId' => $student->id,
                'classId'   => $cls->id,
                'name'      => $student->name,
                'avatar'    => $student->avatar,
            ],
            'class' => [
                'id'         => $cls->id,
                'classCode'  => $cls->class_code,
                'schoolName' => $cls->school_name,
                'shipName'   => $cls->ship_name,
            ],
        ]);
    }
}
