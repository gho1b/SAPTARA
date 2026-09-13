<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsSchoolAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (! $user || $user->role !== 'school_admin' || empty($user->school_id)) {
            return response()->json([
                'error' => 'Akses ditolak. Halaman ini hanya dapat diakses oleh Admin Sekolah yang sah.',
            ], 403);
        }

        return $next($request);
    }
}
