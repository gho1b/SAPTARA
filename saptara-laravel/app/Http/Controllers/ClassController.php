<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    /** GET /api/classes — Guru: list semua kelas milik guru */
    public function index(Request $request)
    {
        $teacher = $request->_teacher;
        $classes = SchoolClass::withCount('students')
            ->where('teacher_id', $teacher->id)
            ->latest()
            ->get();
        return response()->json($classes);
    }

    /** POST /api/classes — Guru: buat kelas baru */
    public function store(Request $request)
    {
        if (! $request->has('school_name') && $request->has('schoolName')) {
            $request->merge(['school_name' => $request->schoolName]);
        }
        if (! $request->has('class_code') && $request->has('classCode')) {
            $request->merge(['class_code' => $request->classCode]);
        }
        if (! $request->has('ship_name') && $request->has('shipName')) {
            $request->merge(['ship_name' => $request->shipName]);
        }

        $request->validate([
            'school_name' => 'required|string',
            'class_code'  => 'required|string',
            'ship_name'   => 'nullable|string',
        ]);

        $teacher  = $request->_teacher;
        $code     = strtoupper($request->class_code);
        $shipName = $request->ship_name
            ?? 'Kapal ' . last(explode(' ', $request->school_name)) . ' ' . $code;

        $exists = SchoolClass::where('class_code', $code)
            ->where('school_name', $request->school_name)
            ->exists();

        if ($exists) {
            return response()->json(['error' => "Kelas $code di {$request->school_name} sudah terdaftar!"], 409);
        }

        $class = SchoolClass::create([
            'teacher_id'  => $teacher->id,
            'school_name' => $request->school_name,
            'class_code'  => $code,
            'ship_name'   => $shipName,
            'semester'    => $request->semester,
            'tahun_ajaran'=> $request->tahun_ajaran,
        ]);

        return response()->json($class, 201);
    }

    /** GET /api/classes/{id} — Detail kelas + daftar siswa */
    public function show(Request $request, int $id)
    {
        $class = SchoolClass::with('students')->findOrFail($id);
        return response()->json($class);
    }

    /** DELETE /api/classes/{id} — Guru: hapus kelas */
    public function destroy(Request $request, int $id)
    {
        $teacher = $request->_teacher;
        $class   = SchoolClass::where('id', $id)
            ->where('teacher_id', $teacher->id)
            ->firstOrFail();
        $class->delete();
        return response()->json(['success' => true]);
    }
}
