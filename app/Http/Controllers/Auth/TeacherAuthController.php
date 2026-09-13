<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class TeacherAuthController extends Controller
{
    /**
     * Register a new teacher account.
     */
    public function register(Request $request)
    {
        $request->validate([
            'school_id' => 'nullable|integer|exists:schools,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string|min:8',
            'display_name' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'teacher',
        ]);

        $teacher = Teacher::create([
            'user_id' => $user->id,
            'school_id' => $request->school_id,
            'display_name' => $request->display_name ?: $request->name,
        ]);
        $teacher->load('school');

        $token = $user->createToken('teacher-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'teacher' => $teacher,
        ], 201);
    }

    /**
     * Login and return a Sanctum token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['error' => 'Email atau password salah'], 401);
        }

        $user = Auth::user();
        $teacher = Teacher::with('school')->firstOrCreate(
            ['user_id' => $user->id],
            ['display_name' => $user->name ?: explode('@', $user->email)[0]]
        );
        if (! $teacher->relationLoaded('school')) {
            $teacher->load('school');
        }

        $token = $user->createToken('teacher-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'teacher' => $teacher,
        ]);
    }

    /**
     * Logout (revoke current token).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get current authenticated teacher.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $teacher = Teacher::with('school')->where('user_id', $user->id)->first() ?? $request->_teacher;

        return response()->json([
            'user' => $user,
            'teacher' => $teacher,
        ]);
    }
}
