<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class ParentAuthController extends Controller
{
    /**
     * Parent login: child name + classCode → JWT token with role=parent.
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

        $payload = [
            'studentId'   => $student->id,
            'classId'     => $cls->id,
            'studentName' => $student->name,
            'role'        => 'parent',
        ];

        $token = JWTAuth::claims($payload)->fromUser($student);

        return response()->json([
            'token'  => $token,
            'parent' => [
                'studentId'     => $student->id,
                'classId'       => $cls->id,
                'studentName'   => $student->name,
                'studentAvatar' => $student->avatar,
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
