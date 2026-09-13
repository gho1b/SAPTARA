<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SchoolAdminAuthController extends Controller
{
    /**
     * POST /api/school-admin/login
     */
    public function login(Request $request)
    {
        $request->validate([
            'school_id' => 'required|integer|exists:schools,id',
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $school = School::findOrFail($request->school_id);

        if (! $school->is_active) {
            return response()->json([
                'error' => 'Sekolah ini saat ini dalam status non-aktif oleh Super Administrator.',
            ], 403);
        }

        $user = User::where('email', $request->email)
            ->where('school_id', $school->id)
            ->where('role', 'school_admin')
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'error' => 'Email atau kata sandi salah, atau akun Anda tidak terdaftar sebagai Admin di sekolah ini.',
            ], 401);
        }

        // Revoke older school admin tokens for hygiene
        $user->tokens()->where('name', 'school_admin_token')->delete();

        $token = $user->createToken('school_admin_token', ['school_admin'])->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'school_id' => $user->school_id,
            ],
            'school' => [
                'id' => $school->id,
                'npsn' => $school->npsn,
                'name' => $school->name,
                'city' => $school->city,
                'province' => $school->province,
                'logo' => $school->logo,
            ],
        ]);
    }

    /**
     * GET /api/school-admin/me
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $school = School::withCount(['classes', 'teachers', 'students'])->find($user->school_id);

        return response()->json([
            'user' => $user,
            'school' => $school,
        ]);
    }

    /**
     * POST /api/school-admin/logout
     */
    public function logout(Request $request)
    {
        if ($request->user() && $request->user()->currentAccessToken()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil keluar dari sesi Admin Sekolah.',
        ]);
    }
}
