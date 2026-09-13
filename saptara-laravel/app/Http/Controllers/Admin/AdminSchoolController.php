<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\HabitCompletion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminSchoolController extends Controller
{
    /**
     * POST /api/admin/login — Login Administrator
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['error' => 'Email atau password administrator salah'], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Akses ditolak — akun Anda bukan Administrator'], 403);
        }

        $token = $user->createToken('admin-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user,
        ]);
    }

    /**
     * GET /api/admin/me — Profil Administrator
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * GET /api/admin/dashboard/stats — Statistik Agregat Nasional
     */
    public function dashboardStats()
    {
        $totalSchools    = School::count();
        $activeSchools   = School::where('is_active', true)->count();
        $inactiveSchools = $totalSchools - $activeSchools;

        $totalTeachers   = Teacher::count();
        $totalStudents   = Student::count();
        $totalClasses    = SchoolClass::count();
        $totalHabitLogs  = HabitCompletion::count();

        $recentSchools = School::withCount(['classes', 'teachers', 'students'])
            ->latest()
            ->take(5)
            ->get();

        return response()->json([
            'total_schools'     => $totalSchools,
            'active_schools'    => $activeSchools,
            'inactive_schools'  => $inactiveSchools,
            'total_teachers'    => $totalTeachers,
            'total_students'    => $totalStudents,
            'total_classes'     => $totalClasses,
            'total_habit_logs'  => $totalHabitLogs,
            'recent_schools'    => $recentSchools,
        ]);
    }

    /**
     * GET /api/admin/schools — Daftar Master Sekolah dengan Filter & Pagination
     */
    public function index(Request $request)
    {
        $query = School::withCount(['classes', 'teachers', 'students']);

        // Search filter (name, npsn, city, province)
        if ($request->filled('search')) {
            $keyword = trim((string) $request->search);
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->orWhere('npsn', 'like', "%{$keyword}%")
                  ->orWhere('city', 'like', "%{$keyword}%")
                  ->orWhere('district', 'like', "%{$keyword}%")
                  ->orWhere('province', 'like', "%{$keyword}%");
            });
        }

        // Status filter: active, inactive, all
        if ($request->filled('status') && $request->status !== 'all') {
            $isActive = $request->status === 'active';
            $query->where('is_active', $isActive);
        }

        // Province filter
        if ($request->filled('province')) {
            $query->where('province', $request->province);
        }

        // City filter
        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        $perPage = max(1, min(100, (int) $request->input('per_page', 15)));
        $schools = $query->orderBy('name', 'asc')->paginate($perPage);

        return response()->json($schools);
    }

    /**
     * POST /api/admin/schools — Tambah Master Sekolah Baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'npsn'     => 'required|string|size:8|unique:schools,npsn',
            'name'     => 'required|string|max:255',
            'slug'     => 'nullable|string|max:255|unique:schools,slug',
            'address'  => 'nullable|string',
            'village'  => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'city'     => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'phone'    => 'nullable|string|max:50',
            'email'    => 'nullable|email|max:100',
            'website'  => 'nullable|string|max:255',
            'logo'     => 'nullable', // can be file or string
            'is_active'=> 'nullable|boolean',
        ]);

        $logoPath = null;
        if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            $path = $request->file('logo')->store('schools', 'public');
            $logoPath = Storage::url($path);
        } elseif ($request->filled('logo') && is_string($request->logo)) {
            $logoPath = $request->logo;
        }

        $slug = $request->filled('slug')
            ? Str::slug($request->slug)
            : Str::slug($request->name);

        // Ensure unique slug
        $originalSlug = $slug;
        $count = 1;
        while (School::where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$count}";
            $count++;
        }

        $school = School::create([
            'npsn'      => trim((string) $request->npsn),
            'name'      => trim((string) $request->name),
            'slug'      => $slug,
            'address'   => $request->address,
            'village'   => $request->village,
            'district'  => $request->district,
            'city'      => $request->city,
            'province'  => $request->province,
            'phone'     => $request->phone,
            'email'     => $request->email,
            'website'   => $request->website,
            'logo'      => $logoPath,
            'is_active' => $request->has('is_active') ? (bool) $request->is_active : true,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Sekolah {$school->name} berhasil didaftarkan!",
            'school'  => $school,
        ], 201);
    }

    /**
     * GET /api/admin/schools/{id} — Detail Sekolah Lengkap
     */
    public function show(int $id)
    {
        $school = School::with([
            'classes.teacher.user',
            'teachers.user',
        ])
        ->withCount(['classes', 'teachers', 'students'])
        ->findOrFail($id);

        return response()->json($school);
    }

    /**
     * PUT/POST /api/admin/schools/{id} — Update Data Sekolah
     */
    public function update(Request $request, int $id)
    {
        $school = School::findOrFail($id);

        $request->validate([
            'npsn'     => "required|string|size:8|unique:schools,npsn,{$id}",
            'name'     => 'required|string|max:255',
            'slug'     => "nullable|string|max:255|unique:schools,slug,{$id}",
            'address'  => 'nullable|string',
            'village'  => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'city'     => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'phone'    => 'nullable|string|max:50',
            'email'    => 'nullable|email|max:100',
            'website'  => 'nullable|string|max:255',
            'logo'     => 'nullable',
            'is_active'=> 'nullable|boolean',
        ]);

        $data = [
            'npsn'     => trim((string) $request->npsn),
            'name'     => trim((string) $request->name),
            'address'  => $request->address,
            'village'  => $request->village,
            'district' => $request->district,
            'city'     => $request->city,
            'province' => $request->province,
            'phone'    => $request->phone,
            'email'    => $request->email,
            'website'  => $request->website,
        ];

        if ($request->filled('slug')) {
            $data['slug'] = Str::slug($request->slug);
        }

        if ($request->has('is_active')) {
            $data['is_active'] = (bool) $request->is_active;
        }

        if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            $path = $request->file('logo')->store('schools', 'public');
            $data['logo'] = Storage::url($path);
        } elseif ($request->filled('logo') && is_string($request->logo)) {
            $data['logo'] = $request->logo;
        }

        $school->update($data);

        return response()->json([
            'success' => true,
            'message' => "Data sekolah {$school->name} berhasil diperbarui!",
            'school'  => $school,
        ]);
    }

    /**
     * PATCH /api/admin/schools/{id}/toggle-status — Ubah Status Aktif/Nonaktif Sekolah
     */
    public function toggleStatus(int $id)
    {
        $school = School::findOrFail($id);
        $school->update(['is_active' => ! $school->is_active]);

        $statusStr = $school->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'success'   => true,
            'message'   => "Status sekolah {$school->name} berhasil {$statusStr}!",
            'is_active' => $school->is_active,
            'school'    => $school,
        ]);
    }

    /**
     * DELETE /api/admin/schools/{id} — Hapus Master Sekolah
     */
    public function destroy(int $id)
    {
        $school = School::withCount(['classes', 'students'])->findOrFail($id);

        if ($school->students_count > 0) {
            return response()->json([
                'error' => "Sekolah tidak dapat dihapus karena masih memiliki {$school->students_count} siswa terdaftar. Silakan nonaktifkan status sekolah sebagai gantinya."
            ], 422);
        }

        $name = $school->name;
        $school->delete();

        return response()->json([
            'success' => true,
            'message' => "Sekolah {$name} berhasil dihapus!",
        ]);
    }

    /**
     * GET /api/admin/schools/{id}/admin-account — Info Akun Admin Sekolah
     */
    public function getSchoolAdminAccount(int $id)
    {
        $school = School::findOrFail($id);
        $admin = User::where('school_id', $school->id)
            ->where('role', 'school_admin')
            ->first();

        return response()->json([
            'has_admin' => !empty($admin),
            'admin'     => $admin ? [
                'id'         => $admin->id,
                'name'       => $admin->name,
                'email'      => $admin->email,
                'created_at' => $admin->created_at,
            ] : null,
        ]);
    }

    /**
     * POST /api/admin/schools/{id}/admin-account — Buat atau Reset Akun Admin Sekolah
     */
    public function saveSchoolAdminAccount(Request $request, int $id)
    {
        $school = School::findOrFail($id);

        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        // Check if email already used by another user with different school/role
        $existing = User::where('email', $request->email)->first();
        if ($existing && ($existing->school_id != $school->id || $existing->role !== 'school_admin')) {
            return response()->json([
                'error' => "Email {$request->email} sudah terdaftar di sistem untuk pengguna lain.",
            ], 422);
        }

        $admin = User::updateOrCreate(
            [
                'school_id' => $school->id,
                'role'      => 'school_admin',
            ],
            [
                'name'              => $request->name,
                'email'             => $request->email,
                'password'          => Hash::make($request->password),
                'email_verified_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Akun Admin Sekolah untuk {$school->name} berhasil disimpan!",
            'admin'   => [
                'id'    => $admin->id,
                'name'  => $admin->name,
                'email' => $admin->email,
            ],
        ]);
    }
}

